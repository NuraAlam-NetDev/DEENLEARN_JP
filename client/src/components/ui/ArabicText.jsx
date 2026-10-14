const sizes = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl sm:text-4xl', xl: 'text-4xl sm:text-5xl' };

// Arabic text: right-to-left, Amiri font, roomy line height.
// <ArabicText size="lg">بِسْمِ ٱللَّهِ</ArabicText>
export default function ArabicText({ as: Tag = 'p', size = 'md', className = '', children, ...props }) {
  return (
    <Tag lang="ar" dir="rtl" className={`arabic ${sizes[size]} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
