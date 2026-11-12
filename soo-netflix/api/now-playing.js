// Vercel Serverless Function: /api/now-playing
// TMDB 키는 Vercel 환경변수(TMDB_API_KEY)에서만 읽어서 브라우저에 노출되지 않음
module.exports = async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "TMDB_API_KEY 환경변수가 설정되지 않았습니다." });
    return;
  }

  const params = new URLSearchParams({ language: "ko-KR", region: "KR", page: "1" });
  const headers = { accept: "application/json" };

  if (apiKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    params.set("api_key", apiKey);
  }

  try {
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/now_playing?${params}`, { headers });
    const data = await tmdbRes.json();
    if (!tmdbRes.ok) {
      res.status(tmdbRes.status).json({ error: data.status_message || "TMDB 요청 실패" });
      return;
    }
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).json({ results: data.results });
  } catch (err) {
    res.status(502).json({ error: "TMDB 서버에 연결할 수 없습니다." });
  }
};
