/**
 * ============================================================================
 * ОДНОКНОПОЧНЫЙ МАСТЕР ОБНОВЛЕНИЯ РЕПОЗИТОРИЯ И GITHUB PAGES (VITRUVIUM)
 * ============================================================================
 * Позволяет в 1 клик:
 * 1. Сохранить и выгрузить весь исходный код проекта в репозиторий (ветка main).
 * 2. Автоматически установить зависимости (npm install), если проект только что скачан.
 * 3. Выполнить чистую сборку (npm run build) с автоматическим base path.
 * 4. Опубликовать рабочий сайт на GitHub Pages (ветка gh-pages).
 * 
 * Особенности:
 * - Запоминает URL репозитория и последний токен в deploy-config.json.
 * - Если токен не подошел или устарел, не завершает работу с ошибкой,
 *   а запрашивает новый токен прямо в консоли, сохраняет его и повторяет отправку!
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const LOCAL_CONFIG_FILE = path.join(__dirname, 'deploy-config.json');
const GLOBAL_CONFIG_FILE = path.join(os.homedir(), '.vitruvium-deploy-config.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function loadConfig() {
  let config = {};
  // 1. Try loading from global config in user home directory (survives project folder replacement)
  if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf8');
      config = JSON.parse(data) || {};
    } catch (e) {}
  }
  
  // 2. Fallback or merge with local config if global is empty
  if ((!config.githubRepoUrl || !config.githubToken) && fs.existsSync(LOCAL_CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(LOCAL_CONFIG_FILE, 'utf8');
      const localConfig = JSON.parse(data) || {};
      if (localConfig.githubRepoUrl && !config.githubRepoUrl) config.githubRepoUrl = localConfig.githubRepoUrl;
      if (localConfig.githubToken && !config.githubToken) config.githubToken = localConfig.githubToken;
    } catch (e) {}
  }
  
  return config;
}

function saveConfig(config) {
  const jsonStr = JSON.stringify(config, null, 2);
  // 1. Save to global config in user home directory (survives project folder replacement)
  try {
    fs.writeFileSync(GLOBAL_CONFIG_FILE, jsonStr, 'utf8');
  } catch (e) {
    console.error('Не удалось сохранить глобальный конфиг в память компьютера:', e.message);
  }
  // 2. Save to local config in project folder
  try {
    fs.writeFileSync(LOCAL_CONFIG_FILE, jsonStr, 'utf8');
  } catch (e) {
    // ignore if local write fails
  }
}

function updateReadme(config) {
  const { user, repoName } = parseRepo(config.githubRepoUrl);
  const ghPagesUrl = `https://${user}.github.io/${repoName}/`;
  const readmeContent = `# Витрувий — Конструктор карточек НРИ

Бесплатное веб-приложение для создания кастомных карточек для НРИ-системы "Витрувий" (и не только). Приложение создано Sora с использованием AI Studio (полный вайбкодинг) на базе веб-приложения от legasquick в 2026 году.

🌐 **Сайт проекта (GitHub Pages):** [${ghPagesUrl}](${ghPagesUrl})
`;
  try {
    fs.writeFileSync(path.join(__dirname, 'README.md'), readmeContent, 'utf8');
  } catch (e) {
    console.error('Не удалось обновить README.md:', e.message);
  }
}

function isAuthError(msg) {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return (
    m.includes('invalid username or token') ||
    m.includes('password authentication is not supported') ||
    m.includes('authentication failed') ||
    m.includes('bad credentials') ||
    m.includes('could not read username') ||
    m.includes('permission to') && m.includes('denied') ||
    m.includes('403') ||
    m.includes('401')
  );
}

function parseRepo(url) {
  let cleanUrl = (url || '').trim().replace(/\/+$/, '');
  const match = cleanUrl.match(/github\.com[/:]([^\/]+)\/([^\/\.]+)/i);
  let user = 'user';
  let repoName = 'Vitruvium-cards';
  if (match) {
    user = match[1];
    repoName = match[2].replace(/\.git$/i, '');
  }
  return { user, repoName, cleanUrl };
}

function getAuthUrl(config) {
  const { user, repoName } = parseRepo(config.githubRepoUrl);
  const cleanToken = (config.githubToken || '').trim();
  return {
    user,
    repoName,
    authUrl: `https://x-access-token:${encodeURIComponent(cleanToken)}@github.com/${user}/${repoName}.git`,
    cleanToken
  };
}

async function configureSettings(config) {
  console.log('\n------------------------------------------------------');
  console.log('   ⚙️ НАСТРОЙКА ПОДКЛЮЧЕНИЯ К GITHUB');
  console.log('------------------------------------------------------');
  console.log('Пример URL репозитория: https://github.com/xysenya/sora-vitruvium-cards.git\n');
  
  const repoPrompt = config.githubRepoUrl 
    ? `URL репозитория GitHub [${config.githubRepoUrl}]: ` 
    : 'URL репозитория GitHub: ';
  const repoInput = await question(repoPrompt);
  if (repoInput.trim()) {
    config.githubRepoUrl = repoInput.trim();
  }

  console.log('\nВНИМАНИЕ: GitHub НЕ принимает обычный пароль от аккаунта!');
  console.log('Нужен Personal Access Token (classic) с правами "repo".');
  console.log('Получить его можно за 1 минуту:');
  console.log('👉 https://github.com/settings/tokens -> Generate new token (classic) -> галочка [x] repo\n');

  const tokenPrompt = config.githubToken 
    ? `GitHub Token [••••••••${config.githubToken.slice(-4)}]: ` 
    : 'GitHub Personal Access Token (ghp_...): ';
  const tokenInput = await question(tokenPrompt);
  if (tokenInput.trim()) {
    config.githubToken = tokenInput.trim();
  }

  if (config.githubToken && !config.githubToken.startsWith('ghp_') && !config.githubToken.startsWith('github_pat_')) {
    console.log('\n⚠️ Внимание: введенный токен не похож на стандартный токен GitHub (обычно начинается на "ghp_").');
  }

  saveConfig(config);
  console.log('\n✅ Настройки сохранены в deploy-config.json!\n');
}

async function requestNewTokenOrRepo(config, branchName, originalErrorMsg) {
  console.log('\n' + '='.repeat(62));
  console.log(`   🔑 ОШИБКА АВТОРИЗАЦИИ GITHUB (ВЕТКА ${branchName.toUpperCase()})`);
  console.log('='.repeat(62));
  console.log('GitHub отклонил авторизацию с текущим токеном.');
  console.log('Сохраненный репозиторий: ' + (config.githubRepoUrl || 'не задан'));
  console.log('Сохраненный токен:       ••••••••' + (config.githubToken ? config.githubToken.slice(-4) : ''));
  console.log('\nДля работы нужен Personal Access Token (classic) с правами "repo":');
  console.log('1. Откройте в браузере: https://github.com/settings/tokens');
  console.log('2. Нажмите: Generate new token -> Generate new token (classic)');
  console.log('3. Обязательно отметьте галочку: [x] repo (полный доступ к репозиторию)');
  console.log('4. Нажмите «Generate token» внизу и скопируйте ключ (начинается на ghp_...)\n');

  console.log('Что вы хотите сделать?');
  console.log(' [1] Ввести новый токен GitHub прямо сейчас (рекомендуется)');
  console.log(' [2] Изменить адрес репозитория и ввести новый токен');
  console.log(` [3] Пропустить отправку в ${branchName} и продолжить сборку`);
  console.log(' [0] Отменить и выйти');

  const action = (await question('\nВаш выбор [1]: ')).trim() || '1';

  if (action === '0') {
    console.log('\nОперация отменена пользователем.');
    rl.close();
    process.exit(0);
  }

  if (action === '3') {
    console.log(`\n⏩ Пропускаем отправку в ветку ${branchName} по вашему запросу...`);
    return { retry: false, skipped: true };
  }

  if (action === '2') {
    const repoInput = await question(`URL репозитория GitHub [${config.githubRepoUrl}]: `);
    if (repoInput.trim()) {
      config.githubRepoUrl = repoInput.trim();
    }
  }

  const tokenInput = await question(`Введите новый GitHub Personal Access Token (ghp_...): `);
  if (tokenInput.trim()) {
    config.githubToken = tokenInput.trim();
    saveConfig(config);
    console.log('\n✅ Новый токен сохранен в deploy-config.json!\n');
    return { retry: true, skipped: false };
  } else {
    console.log('\n⚠️ Токен не был введен. Пропускаем этот шаг.');
    return { retry: false, skipped: true };
  }
}

async function pushWithRetry(cwd, cmdGenerator, branchName, config) {
  while (true) {
    const { authUrl, cleanToken } = getAuthUrl(config);
    const cmd = cmdGenerator(authUrl);
    try {
      execSync(cmd, { cwd, stdio: 'pipe' });
      return true; // Успешно отправлено!
    } catch (err) {
      let msg = err.stderr ? err.stderr.toString() : err.message;
      if (cleanToken) msg = msg.split(cleanToken).join('••••••••');

      if (isAuthError(msg)) {
        console.warn(`\n      ⚠️ Сервер отклонил токен доступа:`);
        console.warn('      ' + msg.trim().split('\n')[0]);
        const resolution = await requestNewTokenOrRepo(config, branchName, msg);
        if (resolution.retry) {
          console.log(`\n🔄 Повторяем отправку в ветку ${branchName} с обновленным токеном...`);
          continue;
        } else {
          return false;
        }
      } else {
        console.warn(`\n      ⚠️ Ошибка отправки (${branchName}):\n` + msg.trim());
        const ans = await question(`\nПовторить попытку отправки? (y/n) [y]: `);
        if (ans.trim().toLowerCase() === 'n') {
          return false;
        }
        continue;
      }
    }
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('   🚀 ОДНОКНОПОЧНОЕ ОБНОВЛЕНИЕ РЕПОЗИТОРИЯ И САЙТА');
  console.log('                 «ВИТРУВИЙ» (VITRUVIUM)');
  console.log('======================================================\n');

  let config = loadConfig();
  const isConfigMode = process.argv.includes('--config');

  if (isConfigMode || !config.githubRepoUrl || !config.githubToken) {
    await configureSettings(config);
    if (isConfigMode) {
      console.log('Настройки обновлены. Для публикации запустите deploy_to_github.bat\n');
      rl.close();
      process.exit(0);
    }
  }

  if (!config.githubRepoUrl || !config.githubToken) {
    console.error('❌ Ошибка: URL репозитория и токен обязательны для публикации.');
    rl.close();
    process.exit(1);
  }

  const { user, repoName } = parseRepo(config.githubRepoUrl);

  // ШАГ 1: Проверка зависимостей (node_modules и vite)
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  const viteBin = path.join(nodeModulesPath, '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
  if (!fs.existsSync(nodeModulesPath) || !fs.existsSync(viteBin)) {
    console.log('[1/4] 📦 Установка библиотек проекта (npm install)...');
    console.log('      (Выполняется один раз при первом запуске, подождите немного)');
    try {
      execSync('npm install', { stdio: 'inherit', cwd: __dirname });
      console.log('      ✅ Библиотеки успешно установлены!\n');
    } catch (installErr) {
      console.error('❌ Не удалось выполнить npm install:', installErr.message);
      rl.close();
      process.exit(1);
    }
  } else {
    console.log('[1/4] 📦 Библиотеки проекта проверены (установлены).');
  }

  // Обновляем README.md с актуальной ссылкой на GitHub Pages
  updateReadme(config);

  // ШАГ 2: Выгрузка исходного кода в репозиторий (ветка main)
  console.log('\n[2/4] 📂 Выгрузка исходного кода в репозиторий GitHub (ветка main)...');
  try {
    const runRootGit = (cmd) => execSync(cmd, { cwd: __dirname, stdio: 'pipe' });

    if (!fs.existsSync(path.join(__dirname, '.git'))) {
      runRootGit('git init');
    }

    runRootGit('git config user.name "Vitruvium Deployer"');
    runRootGit('git config user.email "deployer@vitruvium.app"');

    try {
      runRootGit('git branch -M main');
    } catch (e) {
      runRootGit('git checkout -B main');
    }

    runRootGit('git add -A');

    try {
      runRootGit(`git commit -m "Update Vitruvium App & README - ${new Date().toLocaleString('ru-RU')}"`);
    } catch (e) {
      // Нет изменений, всё в порядке
    }

    const pushMainSuccess = await pushWithRetry(
      __dirname,
      (targetAuthUrl) => `git push --force "${targetAuthUrl}" main`,
      'main',
      config
    );

    if (pushMainSuccess) {
      console.log('      ✅ Исходный код успешно обновлен в ветке main!');
    } else {
      console.log('      ⚠️ Отправка в ветку main была пропущена. Продолжаем сборку и публикацию сайта...');
    }
  } catch (err) {
    console.warn('      ⚠️ Предупреждение при подготовке репозитория: ' + err.message);
  }

  // ШАГ 3: Сборка проекта
  console.log('\n[3/4] 🔨 Сборка проекта (npm run build)...');
  try {
    const currentRepo = parseRepo(config.githubRepoUrl).repoName;
    const buildEnv = {
      ...process.env,
      VITE_BASE_PATH: `/${currentRepo}/`,
      NODE_ENV: 'production'
    };
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname, env: buildEnv });
  } catch (error) {
    console.error('\n❌ Ошибка сборки проекта. Проверьте сообщения выше.');
    rl.close();
    process.exit(1);
  }

  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    console.error('❌ Папка dist не найдена после сборки.');
    rl.close();
    process.exit(1);
  }

  // ШАГ 4: Публикация сайта на GitHub Pages (ветка gh-pages)
  console.log('\n[4/4] 🚀 Публикация сайта на GitHub Pages (ветка gh-pages)...');
  try {
    // .nojekyll для корректной работы всех ассетов
    fs.writeFileSync(path.join(distPath, '.nojekyll'), '');

    // (README.md не создается и не обновляется в gh-pages)

    // Удаляем .gitignore из dist
    const distGitignore = path.join(distPath, '.gitignore');
    if (fs.existsSync(distGitignore)) {
      try {
        fs.unlinkSync(distGitignore);
      } catch (e) {}
    }

    const runDistGit = (cmd) => execSync(cmd, { cwd: distPath, stdio: 'pipe' });

    runDistGit('git init');
    runDistGit('git config user.name "Vitruvium Deployer"');
    runDistGit('git config user.email "deployer@vitruvium.app"');
    runDistGit('git checkout -b gh-pages');
    runDistGit('git add -A');
    runDistGit(`git commit -m "Deploy Vitruvium App - ${new Date().toISOString()}"`);

    const pushPagesSuccess = await pushWithRetry(
      distPath,
      (targetAuthUrl) => `git push --force "${targetAuthUrl}" gh-pages`,
      'gh-pages',
      config
    );

    if (pushPagesSuccess) {
      const finalRepo = parseRepo(config.githubRepoUrl);
      console.log('\n======================================================');
      console.log('   🎉 ВСЁ ГОТОВО! РЕПОЗИТОРИЙ И САЙТ УСПЕШНО ОБНОВЛЕНЫ');
      console.log('======================================================');
      console.log(`\n📁 Исходный код на GitHub: https://github.com/${finalRepo.user}/${finalRepo.repoName}`);
      console.log(`🌐 Работающий сайт:        https://${finalRepo.user}.github.io/${finalRepo.repoName}/\n`);
      console.log('💡 Если сайт открывается впервые, GitHub Pages активируется в течение 1-2 минут.');
      console.log('Убедитесь, что в репозитории (Settings -> Pages) выбран источник "Deploy from a branch", ветка "gh-pages" (root).\n');
    } else {
      console.log('\n⚠️ Публикация на GitHub Pages была отменена или не завершена.');
    }
  } catch (error) {
    console.error('\n❌ Непредвиденная ошибка при публикации: ' + error.message);
  } finally {
    rl.close();
  }
}

main();
