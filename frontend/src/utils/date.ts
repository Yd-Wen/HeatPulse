/**
 * 格式化相对时间
 * @param date 日期字符串或 Date 对象
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  }

  // ≥ 24小时，判断是否是本年
  const isSameYear = now.getFullYear() === target.getFullYear();

  if (isSameYear) {
    // 本年：显示 "M月D日"
    return target.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  } else {
    // 非本年：显示 "YYYY年M月D日"
    return target.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}