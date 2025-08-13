// api/proxy.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import cheerio from 'cheerio';

export async function GET() {
  const channelUrl = 'https://t.me/s/stojpoKarmanu';

  try {
    const { data } = await axios.get(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    });

    const $ = cheerio.load(data);
    const posts = [];

    $('.tgme_channel_post').each((i, el) => {
      const $post = $(el);
      const id = $post.attr('data-post').split('/')[1];
      const dateEl = $post.find('.tgme_channel_post_date');
      const date = dateEl.attr('datetime') || '';
      const text = $post.find('.tgme_channel_post_text').text().trim();
      const photo = $post.find('.tgme_channel_post_image img').attr('src') || null;

      if (text) {
        posts.push({
          id,
          date,
          text,
          photo
        });
      }
    });

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Ошибка парсинга канала:', error.message);
    return NextResponse.json(
      { success: false, error: 'Не удалось загрузить канал' },
      { status: 500 }
    );
  }
}