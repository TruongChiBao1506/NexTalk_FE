export const formatRelativeTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getTime() === 0) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 10) return 'vừa xong';
  if (diffSecs < 60) return `${diffSecs} giây trước`;
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
};

