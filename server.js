const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const app = express();

const playerUrls = [
  'http://stats.red-bear.ru/total_tvt/personal?player_name=[SAS]DON',
  'http://stats.red-bear.ru/total_tvt/personal?player_name=[SAS]Артур',
  'http://stats.red-bear.ru/total_tvt/personal?player_name=[SAS]Dolg',
  'http://stats.red-bear.ru/total_tvt/personal?player_name=[SAS]Tesak',
  'http://stats.red-bear.ru/total_tvt/personal?player_name=[SAS]Naifu',
  'http://stats.red-bear.ru/total_tvt/personal?player_name=[SAS]Акс'
];

async function parsePlayerData(url) {
  try {
    const response = await axios.get(url);

    if (response.status === 200) {
      const $ = cheerio.load(response.data);
      const table = $('#general-table');
      const rows = table.find('tbody tr');

      const playerData = {};

      rows.each((index, row) => {
        const cells = $(row).find('td');
        if (cells.length === 2) {
          const label = $(cells[0]).text().trim();
          const value = $(cells[1]).text().trim();
          playerData[label] = parseInt(value, 10) || 0;
        }
      });

      return playerData;
    }
  } catch (error) {
    console.error(`Ошибка при загрузке данных с ${url}:`, error);
    return null;
  }
}

app.get('/player-stats', async (req, res) => {
  const players = [];

  for (const url of playerUrls) {
    const playerName = url.split('=')[1];
    const playerData = await parsePlayerData(url);
    if (playerData) {
      players.push({
        name: playerName,
        kills: playerData['Players frags'] || 0,
      });
    }
  }

  res.json(players);
});

app.get('/player-details', async (req, res) => {
  const { name } = req.query;
  const url = playerUrls.find(u => u.includes(name));
  if (!url) return res.status(404).json({ error: 'Игрок не найден' });

  const playerData = await parsePlayerData(url);
  res.json(playerData || { error: 'Не удалось загрузить данные игрока' });
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
  console.log('Сервер запущен на http://localhost:3000');
});
