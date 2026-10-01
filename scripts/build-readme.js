const fs = require('fs');
const path = require('path');

const TEMPLATES_FILE = path.join(__dirname, '../data/templates.json');
const README_FILE = path.join(__dirname, '../README.md');

async function checkDemoUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

function groupByCategory(templates) {
  return templates.reduce((groups, template) => {
    const category = template.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(template);
    return groups;
  }, {});
}

async function buildReadme() {
  console.log('Reading templates.json...');
  const templatesData = fs.readFileSync(TEMPLATES_FILE, 'utf8');
  const templates = JSON.parse(templatesData);

  console.log('Checking demo URLs...');
  const templatesWithStatus = await Promise.all(
    templates.map(async (template) => {
      const isLive = await checkDemoUrl(template.demoUrl);
      return {
        ...template,
        status: isLive ? '🟢 Demo Live' : '🔴 Demo Lỗi'
      };
    })
  );

  const totalTemplates = templatesWithStatus.length;
  const liveDemos = templatesWithStatus.filter(t => t.status === '🟢 Demo Live').length;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    dateStyle: 'full',
    timeStyle: 'medium',
  });
  const lastUpdate = formatter.format(new Date());

  console.log('Grouping by category...');
  const groupedTemplates = groupByCategory(templatesWithStatus);

  console.log('Generating README.md...');
  let markdown = `# 🎨 Awesome Free Portfolio Templates

![Total Templates](https://img.shields.io/badge/Total_Templates-${totalTemplates}-blue)
![Live Demos](https://img.shields.io/badge/Live_Demos-${liveDemos}-green)
![Auto Update](https://img.shields.io/badge/Auto_Update-Daily-purple)

> 🕒 **Last auto update:** ${lastUpdate}

🎨 Kho Template Portfolio & Blog Cá nhân mã nguồn mở cực chất dành cho Lập trình viên. Không cần tự thiết kế CSS đau đầu, chỉ việc chọn 'Gu' của bạn ➞ Fork Repo ➞ Sửa file JSON/Markdown ➞ Deploy lên Vercel/Netlify trong 3 phút!

## 📋 Danh sách Templates

`;

  for (const [category, categoryTemplates] of Object.entries(groupedTemplates)) {
    markdown += `### ${category}\n\n`;
    markdown += `| Tên Template | Mã nguồn | Tech Stack | Mô tả | Trạng thái Demo |\n`;
    markdown += `|-------------|----------|------------|-------|----------------|\n`;

    for (const template of categoryTemplates) {
      const nameLink = `[${template.name}](${template.demoUrl})`;
      const repoLink = `[Repo](${template.repoUrl})`;
      markdown += `| ${nameLink} | ${repoLink} | ${template.techStack} | ${template.description} | ${template.status} |\n`;
    }

    markdown += '\n';
  }

  markdown += `---

## 🤝 Đóng góp

Bạn có template portfolio/blog cá nhân mã nguồn mở đẹp? Hãy mở Pull Request để thêm vào danh sách!

## 📄 License

MIT License - Tự do sử dụng cho mục đích cá nhân và thương mại.

---

_Created with ❤️ for developers by developers_
`;

  fs.writeFileSync(README_FILE, markdown, 'utf8');
  console.log('✅ README.md generated successfully!');
  console.log(`   Total templates: ${totalTemplates}`);
  console.log(`   Live demos: ${liveDemos}`);
}

buildReadme().catch(console.error);
