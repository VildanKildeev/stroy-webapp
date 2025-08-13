// api/proxy.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import cheerio from 'cheerio';

export async function GET() {
  try {
    const { data } = await axios.get('https://t.me/stojpoKarmanu');
    const $ = cheerio.load(data);
    const posts = [];

    $('.tgme_channel_post').each((i, el) => {
      const $el = $(el);
      const date = $el.find('.tgme_channel_post_date').attr('datetime');
      const text = $el.find('.tgme_channel_post_text').text().trim();
      const photo = $el.find('.tgme_channel_post_image img').attr('src') || null;
      if (text) posts.push({ date, text, photo });
    });

    return NextResponse.json({ success: true, posts });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}