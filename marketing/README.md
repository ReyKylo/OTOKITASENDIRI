# OTOKITA Marketing Module

Local-first Marketing module untuk OTOKITA. Buka `index.html` langsung dari browser.

## Pages
- `index.html` — Dashboard Marketing
- `offline.html` — Offline Poster Sebar
- `tiktok.html` — TikTok Organic + Ads
- `meta.html` — Meta Ads
- `partners.html` — Partnership + commission payment journal
- `assets.html` — Asset Library
- `reports.html` — Marketing Report + PDF export

## LocalStorage keys
Shared:
- `otokita.leads`
- `otokita.deals`
- `otokita.journal`
- `otokita.coa`
- `otokita.settings`

Marketing:
- `otokita.marketing.assets`
- `otokita.marketing.offline_batches`
- `otokita.marketing.tiktok_videos`
- `otokita.marketing.tiktok_video_metrics`
- `otokita.marketing.tiktok_ads`
- `otokita.marketing.tiktok_ad_metrics`
- `otokita.marketing.meta_campaigns`
- `otokita.marketing.meta_metrics`
- `otokita.marketing.partners`
- `otokita.marketing.partner_payments`
- `otokita.marketing.journal_links`

## Lead attribution patch
Module ini silent-migrate `otokita.leads` supaya tiap lead punya:

```json
{
  "lead_source": {
    "channel": "offline | tiktok_organic | tiktok_ads | meta_ads | partnership | unknown",
    "sub_channel": null,
    "campaign_id": null,
    "campaign_name": null,
    "partner_id": null,
    "tracking_code": null,
    "source_note": null
  }
}
```

## Financial bridge
Payment partner atau biaya marketing bisa dipost ke `otokita.journal`:

```text
Dr 52000 Biaya Marketing
Cr 11000 Kas & Bank
```

## CSV import
TikTok / Meta metric import support CSV paste dengan header sesuai fields di modal import.

## Language Fix

Language toggle sekarang tidak bergantung penuh ke `fetch(lang/*.json)`. Kalau browser memblokir JSON ketika file dibuka via double-click (`file://`), dictionary ID/中文 tetap jalan dari fallback inline di `js/i18n.js`.
