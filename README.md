
# docs-manager

Single source of truth for **Packing Slips** and **Proof of Delivery** with auto-incrementing document numbers and PDF generation.

## What it does
- Generates the next number in sequence per doc type (PACKING, POD) using a transactional sequence table.
- Simple HTML forms for both document types.
- Saves documents and line items to MySQL.
- Renders PDFs using Dompdf.
- POD supports on-screen signature capture and embeds the signature in the PDF.

## Stack
- PHP 8+
- MySQL 8+
- Apache 2.4+
- Composer packages: `dompdf/dompdf`

## Quick start
1) Create database and tables:
```sql
CREATE DATABASE docs_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Import schema:
```bash
mysql -u <user> -p docs_manager < db/schema.sql
```

2) Copy config, then edit credentials:
```bash
cp includes/config.sample.php includes/config.php
# edit includes/config.php
```

3) Install composer deps in this folder:
```bash
composer install
```

4) Point your vhost or nginx site to `public/` as document root, or serve via Apache Alias.

5) Visit `/index.php`:
- Create Packing Slip or POD
- Add line items
- Save -> View or PDF

## Seeding sequences
By default schema seeds `PACKING` and `POD` to 1001. Change in `db/schema.sql` if you want a different start.

## Security
- This is an MVP. Add your auth or IP allowlist as needed.
- `includes/config.php` is gitignored.

## Folder layout
- `db/` SQL schema
- `includes/` DB and helpers
- `templates/` HTML for PDF views
- `public/` routes and assets

## Deploy
- Upload this folder to your server as `/var/www/BlueUnicorn/docs-manager`
- Ensure PHP has write access if you later choose to store uploaded signatures as files.
- Enable HTTPS.
