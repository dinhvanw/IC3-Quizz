import React from 'react';

/**
 * Utility để render HTML text an toàn
 * Loại bỏ script tags nhưng giữ lại formatting tags như span, b, i, u, br, etc.
 */

export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  
  // Nếu chạy trên client-side
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Loại bỏ script tags
    const scripts = temp.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    return temp.innerHTML;
  }
  
  // Fallback: chỉ remove script/style tags bằng regex
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
}

/**
 * Component để render HTML text với an toàn
 */
export function HtmlText({ content, className = '' }) {
  if (!content) return null;
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }}
    />
  );
}

/**
 * Render HTML inline (cho heading, span, v.v.)
 */
export function HtmlInline({ content, className = '' }) {
  if (!content) return null;
  
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || '') }}
    />
  );
}
