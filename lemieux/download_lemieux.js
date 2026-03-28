#!/usr/bin/env node

/**
 * LeMieux Product Scraper & Image Downloader (v2)
 *
 * Scrapes two categories from lemieux.com:
 *   1. Hobby Horses + Accessories → ./hobby-horses/
 *   2. Real Horse Accessories (Horsewear) → ./horsewear/
 *
 * Horsewear crawls all subcategory pages to find every product.
 *
 * Each folder gets:
 *   - images/         — downloaded product images
 *   - products.json   — JSON array with name, description, image, image_url, url
 *
 * Usage: node download_lemieux.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.lemieux.com';

// ── HTTP helpers ──────────────────────────────────────────────

function httpGet(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redir = res.headers.location;
        if (redir.startsWith('/')) redir = BASE + redir;
        res.resume();
        return httpGet(redir, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function stripHtml(s) {
  return (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function safeFilename(url) {
  const parts = url.split('/');
  let name = parts[parts.length - 1].split('?')[0];
  name = name.replace(/[^a-z0-9._-]/gi, '_');
  if (!name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) name += '.jpg';
  return name;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Extract product links from a collection/category HTML page ─

function extractProductLinks(html, linkPrefixes) {
  const products = [];
  const seen = new Set();

  // Strategy 1: Find <a> tags with class containing "p1" (product name links)
  // Pattern: <a class="p1 ..." href="/horsewear/boots-bandages/mesh-brushing-boot">Product Name</a>
  const p1Pattern = /<a[^>]*class="[^"]*p1[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = p1Pattern.exec(html)) !== null) {
    const link = m[1], name = m[2].trim();
    if (matchesPrefix(link, linkPrefixes) && isProductLink(link, linkPrefixes) && name.length > 2 && !seen.has(link)) {
      seen.add(link);
      products.push({ name, link });
    }
  }

  // Strategy 1b: Same but href before class
  const p1bPattern = /<a[^>]*href="([^"]+)"[^>]*class="[^"]*p1[^"]*"[^>]*>([^<]+)<\/a>/gi;
  while ((m = p1bPattern.exec(html)) !== null) {
    const link = m[1], name = m[2].trim();
    if (matchesPrefix(link, linkPrefixes) && isProductLink(link, linkPrefixes) && name.length > 2 && !seen.has(link)) {
      seen.add(link);
      products.push({ name, link });
    }
  }

  // Strategy 2: Look for product-card containers, then extract href + text
  // The cards have: <a ... href="..." ...> somewhere inside .product-card divs
  // We'll find all href links that point to deep product pages
  const hrefPattern = /href="(\/(?:horsewear|toys)\/[a-z0-9-]+\/[a-z0-9-][^"]+)"/gi;
  while ((m = hrefPattern.exec(html)) !== null) {
    const link = m[1];
    if (!seen.has(link) && matchesPrefix(link, linkPrefixes) && isProductLink(link, linkPrefixes)) {
      seen.add(link);
      // Try to find a nearby name - search for text near this link
      const idx = m.index;
      const snippet = html.substring(idx, idx + 500);
      const nameMatch = snippet.match(/>([A-Z][A-Za-z0-9 &'.,()-]{3,80})</);
      const name = nameMatch ? nameMatch[1].trim() : '';
      if (name && !name.includes('£') && !name.match(/^(Canada|Australia|Europe|United|Rest|UAE|New)/)) {
        products.push({ name, link });
      }
    }
  }

  return products;
}

function matchesPrefix(link, prefixes) {
  return prefixes.some(p => link.startsWith(p));
}

function isProductLink(link, prefixes) {
  // Product links have at least 3 path segments: /horsewear/boots-bandages/product-name
  // Subcategory links have 2: /horsewear/boots-bandages
  const parts = link.split('/').filter(x => x);
  return parts.length >= 3;
}

// ── Find subcategory links on a landing page ──────────────────

function extractSubcategoryLinks(html, prefix) {
  const subcats = new Set();
  const pattern = new RegExp(`href="(${prefix}/[a-z0-9-]+)"`, 'gi');
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const link = m[1];
    const parts = link.split('/').filter(x => x);
    // Subcategory = exactly 2 segments under prefix (e.g. /horsewear/boots-bandages)
    if (parts.length === 2 && !link.includes('?')) {
      subcats.add(link);
    }
  }
  return Array.from(subcats);
}

// ── Enrich with description + image from product page ─────────

async function enrichProduct(product, index, total) {
  try {
    const html = (await httpGet(BASE + product.link)).toString();

    // Get meta description
    const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
                      html.match(/<meta\s+content="([^"]*)"\s+name="description"/i);
    let desc = metaMatch ? stripHtml(metaMatch[1]) : '';

    // Get the main product image from og:image
    const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i) ||
                    html.match(/<meta\s+content="([^"]*)"\s+property="og:image"/i);
    let image = ogMatch ? ogMatch[1] : '';

    // If no og:image, try static media catalog images
    if (!image) {
      const staticMatch = html.match(/(https:\/\/www\.lemieux\.com\/static\/media\/catalog\/product\/[^"'\s]+\.(jpg|jpeg|png|webp))/i);
      if (staticMatch) image = staticMatch[1];
    }

    // If image is a tco-images proxy URL, extract the original static path
    if (image && image.includes('/tco-images/')) {
      const origMatch = image.match(/(https:\/\/www\.lemieux\.com\/static\/media\/catalog\/product\/[^\s"']+)/);
      if (origMatch) image = origMatch[1];
    }

    return { ...product, description: desc, image_url: image };
  } catch (e) {
    return { ...product, description: '', image_url: '' };
  }
}

// ── Download image ────────────────────────────────────────────

async function downloadImage(url, filepath) {
  if (!url) return false;
  if (fs.existsSync(filepath)) return true;
  try {
    const data = await httpGet(url);
    if (data.length < 500) return false; // Too small, probably an error page
    fs.writeFileSync(filepath, data);
    return true;
  } catch (e) {
    return false;
  }
}

// ── Process Hobby Horses ──────────────────────────────────────

async function processHobbyHorses(outputDir) {
  console.log('\n═══════════════════════════════════════');
  console.log('  HOBBY HORSES & ACCESSORIES');
  console.log('═══════════════════════════════════════\n');

  const imagesDir = path.join(outputDir, 'images');
  fs.mkdirSync(imagesDir, { recursive: true });

  // Scrape the hobby horse collection page
  console.log('Step 1: Scraping collection page...');
  const html = (await httpGet(BASE + '/toys/hobby-horse-collection')).toString();
  let products = extractProductLinks(html, ['/toys']);

  console.log(`  Found ${products.length} products from collection page`);

  // If we didn't find enough, also check individual toy subcategories
  if (products.length < 30) {
    console.log('  Trying additional toy pages...');
    const toyPages = ['/toys/hobby-horse', '/toys/toy-pony', '/toys/riding-accessories', '/toys/stable-toys'];
    for (const page of toyPages) {
      try {
        const subHtml = (await httpGet(BASE + page)).toString();
        const subProducts = extractProductLinks(subHtml, ['/toys']);
        const newOnes = subProducts.filter(p => !products.some(ep => ep.link === p.link));
        products.push(...newOnes);
        if (newOnes.length > 0) console.log(`  +${newOnes.length} from ${page}`);
      } catch (e) { /* skip */ }
      await sleep(300);
    }
    console.log(`  Total: ${products.length} products`);
  }

  // Enrich each product
  console.log('\nStep 2: Fetching product details...');
  const enriched = [];
  for (let i = 0; i < products.length; i++) {
    const p = await enrichProduct(products[i], i, products.length);
    enriched.push(p);
    process.stdout.write(`\r  Progress: ${i + 1}/${products.length}`);
    await sleep(200); // Be polite
  }
  console.log('');

  // Download images
  console.log('\nStep 3: Downloading images...');
  let downloaded = 0, failed = 0;
  for (let i = 0; i < enriched.length; i++) {
    const p = enriched[i];
    if (p.image_url) {
      const filename = safeFilename(p.image_url);
      const filepath = path.join(imagesDir, filename);
      const ok = await downloadImage(p.image_url, filepath);
      if (ok) { p.local_image = 'images/' + filename; downloaded++; }
      else { p.local_image = null; failed++; }
    } else { p.local_image = null; failed++; }
    process.stdout.write(`\r  Progress: ${i + 1}/${enriched.length} (${downloaded} ok, ${failed} failed)`);
    await sleep(100);
  }
  console.log('');

  // Write JSON
  const output = enriched.map(p => ({
    name: p.name,
    description: p.description,
    image: p.local_image,
    image_url: p.image_url,
    url: BASE + p.link
  }));
  fs.writeFileSync(path.join(outputDir, 'products.json'), JSON.stringify(output, null, 2));
  console.log(`\n✓ Saved ${output.length} products to hobby-horses/products.json`);
  console.log(`  Images: ${downloaded} downloaded, ${failed} failed`);
  return output.length;
}

// ── Process Horsewear (multi-subcategory) ─────────────────────

async function processHorsewear(outputDir) {
  console.log('\n═══════════════════════════════════════');
  console.log('  HORSEWEAR (REAL HORSE ACCESSORIES)');
  console.log('═══════════════════════════════════════\n');

  const imagesDir = path.join(outputDir, 'images');
  fs.mkdirSync(imagesDir, { recursive: true });

  // Step 1: Get the landing page and find all subcategories
  console.log('Step 1: Finding subcategories...');
  const landingHtml = (await httpGet(BASE + '/horsewear')).toString();
  let subcats = extractSubcategoryLinks(landingHtml, '/horsewear');

  // Ensure we have the known subcategories
  const knownSubcats = [
    '/horsewear/boots-bandages',
    '/horsewear/fly-hoods',
    '/horsewear/fly-protection',
    '/horsewear/grooming-care',
    '/horsewear/headcollars-leadropes',
    '/horsewear/horse-rugs',
    '/horsewear/saddlery-tack',
    '/horsewear/stable-yard',
    '/horsewear/supplements',
    '/horsewear/saddle-pads'
  ];
  for (const sc of knownSubcats) {
    if (!subcats.includes(sc)) subcats.push(sc);
  }
  console.log(`  Found ${subcats.length} subcategories: ${subcats.map(s => s.split('/').pop()).join(', ')}`);

  // Step 2: Scrape each subcategory for product links
  console.log('\nStep 2: Scraping each subcategory...');
  let allProducts = [];
  const seenLinks = new Set();

  // Also extract any products directly from the landing page
  const landingProducts = extractProductLinks(landingHtml, ['/horsewear']);
  for (const p of landingProducts) {
    if (!seenLinks.has(p.link)) { seenLinks.add(p.link); allProducts.push(p); }
  }
  if (landingProducts.length > 0) console.log(`  Landing page: ${landingProducts.length} products`);

  for (const subcat of subcats) {
    try {
      await sleep(500);
      const html = (await httpGet(BASE + subcat)).toString();
      const products = extractProductLinks(html, ['/horsewear']);
      let added = 0;
      for (const p of products) {
        if (!seenLinks.has(p.link)) {
          seenLinks.add(p.link);
          allProducts.push(p);
          added++;
        }
      }
      const catName = subcat.split('/').pop();
      console.log(`  ${catName}: ${products.length} found, ${added} new (total: ${allProducts.length})`);
    } catch (e) {
      console.log(`  ${subcat.split('/').pop()}: ERROR - ${e.message}`);
    }
  }

  console.log(`\n  Total unique products: ${allProducts.length}`);

  // Step 3: Enrich each product with description + image
  console.log('\nStep 3: Fetching product details...');
  const enriched = [];
  for (let i = 0; i < allProducts.length; i++) {
    const p = await enrichProduct(allProducts[i], i, allProducts.length);
    enriched.push(p);
    process.stdout.write(`\r  Progress: ${i + 1}/${allProducts.length}`);
    await sleep(200);
  }
  console.log('');

  // Backfill names from product pages for any that are missing
  for (const p of enriched) {
    if (!p.name || p.name.length < 3) {
      // Try to get name from the URL
      const slug = p.link.split('/').pop();
      p.name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }

  // Step 4: Download images
  console.log('\nStep 4: Downloading images...');
  let downloaded = 0, failed = 0;
  for (let i = 0; i < enriched.length; i++) {
    const p = enriched[i];
    if (p.image_url) {
      const filename = safeFilename(p.image_url);
      const filepath = path.join(imagesDir, filename);
      const ok = await downloadImage(p.image_url, filepath);
      if (ok) { p.local_image = 'images/' + filename; downloaded++; }
      else { p.local_image = null; failed++; }
    } else { p.local_image = null; failed++; }
    process.stdout.write(`\r  Progress: ${i + 1}/${enriched.length} (${downloaded} ok, ${failed} failed)`);
    await sleep(100);
  }
  console.log('');

  // Step 5: Write JSON
  const output = enriched.map(p => ({
    name: p.name,
    description: p.description,
    image: p.local_image,
    image_url: p.image_url,
    url: BASE + p.link
  }));
  fs.writeFileSync(path.join(outputDir, 'products.json'), JSON.stringify(output, null, 2));
  console.log(`\n✓ Saved ${output.length} products to horsewear/products.json`);
  console.log(`  Images: ${downloaded} downloaded, ${failed} failed`);
  return output.length;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   LeMieux Product Scraper v2          ║');
  console.log('╚═══════════════════════════════════════╝\n');

  const baseDir = __dirname;

  const hobbyCount = await processHobbyHorses(path.join(baseDir, 'hobby-horses'));
  const horsewearCount = await processHorsewear(path.join(baseDir, 'horsewear'));

  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   ALL DONE!                           ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║   Hobby Horses: ${String(hobbyCount).padStart(4)} products         ║`);
  console.log(`║   Horsewear:    ${String(horsewearCount).padStart(4)} products         ║`);
  console.log('╚═══════════════════════════════════════╝');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
