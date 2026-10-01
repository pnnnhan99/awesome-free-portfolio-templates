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
        status: isLive ? '🟢 Demo Live' : '🔴 Demo Down'
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

🎨 A curated collection of high-quality open-source portfolio and blog templates for developers. No need to struggle with CSS design - just pick your style ➞ Fork Repo ➞ Edit JSON/Markdown ➞ Deploy to Vercel/Netlify in 3 minutes!

## 📋 Template List

`;

  for (const [category, categoryTemplates] of Object.entries(groupedTemplates)) {
    markdown += `### ${category}\n\n`;
    markdown += `| Template Name | Source | Tech Stack | Description | Demo Status |\n`;
    markdown += `|---------------|--------|------------|-------------|-------------|\n`;

    for (const template of categoryTemplates) {
      const nameLink = `[${template.name}](${template.demoUrl})`;
      const repoLink = `[Repo](${template.repoUrl})`;
      markdown += `| ${nameLink} | ${repoLink} | ${template.techStack} | ${template.description} | ${template.status} |\n`;
    }

    markdown += '\n';
  }

  markdown += `---

## 🤝 Contributing

Have a beautiful open-source portfolio/blog template? Open a Pull Request to add it to the list!

## 📄 License

MIT License - Free to use for personal and commercial purposes.

---

_Created with ❤️ for developers by developers_
`;

  fs.writeFileSync(README_FILE, markdown, 'utf8');
  console.log('✅ README.md generated successfully!');
  console.log(`   Total templates: ${totalTemplates}`);
  console.log(`   Live demos: ${liveDemos}`);
}

buildReadme().catch(console.error);
