import nodemailer from 'nodemailer';
import type { Hotspot } from '../types';

// 创建邮件传输器
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is incomplete');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

// 发送热点邮件通知
export async function sendHotspotEmail(to: string, hotspot: Hotspot): Promise<void> {
  try {
    const transporter = createTransporter();

    const subject = `🔥 HeatPulse - 新热点发现: ${hotspot.title}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 12px 12px;
    }
    .hotspot-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .hotspot-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .hotspot-summary {
      color: #4b5563;
      margin-bottom: 15px;
    }
    .hotspot-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 14px;
      color: #6b7280;
    }
    .tag {
      background: #e5e7eb;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .score {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    .score-high {
      background: #d1fae5;
      color: #065f46;
    }
    .score-medium {
      background: #fef3c7;
      color: #92400e;
    }
    .score-low {
      background: #fee2e2;
      color: #991b1b;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔥 HeatPulse 热点追踪</h1>
    <p>发现新的 AI 技术热点</p>
  </div>

  <div class="content">
    <div class="hotspot-card">
      <div class="hotspot-title">${escapeHtml(hotspot.title)}</div>
      <div class="hotspot-summary">${escapeHtml(hotspot.ai_summary || hotspot.content || '暂无摘要')}</div>

      <div class="hotspot-meta">
        <span>来源: ${hotspot.source_type}</span>
        <span class="score ${getScoreClass(hotspot.relevance_score)}">
          真实度: ${hotspot.relevance_score}/100
        </span>
        <span>重要性: ${hotspot.importance || 5}/10</span>
      </div>

      ${(() => {
        const tags = typeof hotspot.ai_tags === 'string'
          ? JSON.parse(hotspot.ai_tags)
          : hotspot.ai_tags;
        return tags && tags.length > 0 ? `
      <div style="margin-top: 15px;">
        ${tags.map((tag: string) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
      ` : '';
      })()}
    </div>

    <a href="${hotspot.source_url}" class="button" target="_blank">查看详情</a>

    <div class="footer">
      <p>此邮件由 HeatPulse 自动发送</p>
      <p>如需取消订阅，请在应用设置中修改关键词通知设置</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
🔥 HeatPulse - 新热点发现

标题: ${hotspot.title}

摘要: ${hotspot.ai_summary || hotspot.content || '暂无摘要'}

来源: ${hotspot.source_type}
真实度: ${hotspot.relevance_score}/100
重要性: ${hotspot.importance || 5}/10

链接: ${hotspot.source_url}
    `.trim();

    await transporter.sendMail({
      from: `"HeatPulse" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email] Sent to ${to}: ${hotspot.title}`);
  } catch (error) {
    console.error('[Email] Failed to send:', (error as Error).message);
    throw error;
  }
}

// HTML 转义
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 获取评分样式类
function getScoreClass(score: number): string {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
}

// 测试邮件配置
export async function testEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('[Email] SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('[Email] SMTP configuration is invalid:', (error as Error).message);
    return false;
  }
}
