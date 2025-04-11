
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Utensils,
  GanttChart,
  ChefHat,
  Info,
  Leaf,
  CircleDot,
  List,
  Timer,
  LucideIcon
} from "lucide-react";

interface CookingInstructionsRendererProps {
  instructions: string;
}

interface SectionContent {
  icon: LucideIcon;
  title: string;
  content: JSX.Element[];
}

export const CookingInstructionsRenderer = ({ instructions }: CookingInstructionsRendererProps) => {
  const [parsedSections, setParsedSections] = useState<SectionContent[]>([]);

  useEffect(() => {
    if (!instructions) return;
    
    const formattedInstructions = formatCookingInstructions(instructions);
    setParsedSections(formattedInstructions);
  }, [instructions]);

  return (
    <div className="space-y-6">
      {parsedSections.length === 0 ? (
        <div className="p-4 bg-gray-100 rounded-md">
          <p>Đang tải hướng dẫn...</p>
        </div>
      ) : (
        <>
          {/* Hiển thị phần giới thiệu nếu có */}
          {parsedSections[0]?.title === "Giới thiệu" && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 shrink-0" />
                <div>
                  {parsedSections[0].content}
                </div>
              </div>
            </div>
          )}

          {/* Hiển thị các phần còn lại */}
          {parsedSections.map((section, index) => (
            <div key={`section-${index}`} className="mb-6">
              <div className="flex items-center gap-2 font-semibold text-primary my-4 bg-primary/5 p-3 rounded-lg">
                <section.icon className="h-5 w-5" />
                <h3 className="text-lg">{section.title}</h3>
              </div>
              <div className="ml-2 space-y-1">
                {section.content}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// Hàm để chuyển đổi văn bản thành các phần
const formatCookingInstructions = (text: string): SectionContent[] => {
  if (!text) return [];

  const iconMap: Record<string, LucideIcon> = {
    'ShoppingBag': ShoppingBag,
    'Utensils': Utensils,
    'GanttChart': GanttChart,
    'ChefHat': ChefHat,
    'Info': Info,
    'Leaf': Leaf,
    'CircleDot': CircleDot,
    'List': List,
    'Timer': Timer
  };

  // Thêm phần giới thiệu nếu cần
  const sections: SectionContent[] = [];

  // Định nghĩa các mẫu section và icon tương ứng
  const sectionPatterns = [
    { pattern: /(?:^|\n)(?:##?\s*|)Nguyên liệu(?::|)(.*?)(?=\n(?:##?\s*|)[A-ZĐĂÂÊÔƠƯa-zđăâêôơư]|$)/s, icon: ShoppingBag, title: "Nguyên liệu cần chuẩn bị" },
    { pattern: /(?:^|\n)(?:##?\s*|)Các nguyên liệu(?::|)(.*?)(?=\n(?:##?\s*|)[A-ZĐĂÂÊÔƠƯa-zđăâêôơư]|$)/s, icon: ShoppingBag, title: "Nguyên liệu cần chuẩn bị" },
    { pattern: /(?:^|\n)(?:##?\s*|)Nguyên liệu cần chuẩn bị(?::|)(.*?)(?=\n(?:##?\s*|)[A-ZĐĂÂÊÔƠƯa-zđăâêôơư]|$)/s, icon: ShoppingBag, title: "Nguyên liệu cần chuẩn bị" },
    { pattern: /(?:^|\n)(?:##?\s*|)Hướng dẫn(?::|)(.*?)(?=\n(?:##?\s*|)[A-ZĐĂÂÊÔƠƯa-zđăâêôơư]|$)/s, icon: Utensils, title: "Hướng dẫn" },
    { pattern: /(?:^|\n)(?:##?\s*|)Chuẩn bị(?::|)(.*?)(?=\n(?:##?\s*|)[A-ZĐĂÂÊÔƠƯa-zđăâêôơư]|$)/s, icon: GanttChart, title: "Chuẩn bị" },
    { pattern: /(?:^|\n)(?:##?\s*|)Thực hiện(?::|)(.*?)(?=\n(?:##?\s*|)[A-ZĐĂÂÊÔƠƯa-zđăâêôơư]|$)/s, icon: ChefHat, title: "Thực hiện" },
    { pattern: /(?:^|\n)(?:##?\s*|)Các bước thực hiện(?::|)(.*?)(?=\n(?:##?\s*|)[A-ZĐĂÂÊÔƠƯa-zđăâêôơư]|$)/s, icon: List, title: "Các bước thực hiện" },
    { pattern: /(?:^|\n)(?:##?\s*|)Lưu ý(?::|)(.*?)(?=\n(?:##?\s*|)[A-ZĐĂÂÊÔƠƯa-zđăâêôơư]|$)/s, icon: Info, title: "Lưu ý" },
    { pattern: /(?:^|\n)(?:##?\s*|)Thưởng thức(?::|)(.*?)(?=\n(?:##?\s*|)[A-ZĐĂÂÊÔƠƯa-zđăâêôơư]|$)/s, icon: Leaf, title: "Thưởng thức" },
  ];

  // Đoạn văn bản không thuộc section nào sẽ được đưa vào phần giới thiệu
  let remainingText = text;
  let hasIntroduction = false;
  let hasAnySection = false;

  // Tìm và xử lý từng section
  for (const { pattern, icon, title } of sectionPatterns) {
    const match = remainingText.match(pattern);
    if (match) {
      hasAnySection = true;
      const content = match[1];
      remainingText = remainingText.replace(match[0], "");
      
      // Xử lý nội dung của section
      const formattedContent = processContent(content);
      
      if (formattedContent.length > 0) {
        sections.push({
          icon,
          title,
          content: formattedContent
        });
      }
    }
  }

  // Nếu vẫn còn văn bản chưa được xử lý và chưa có phần giới thiệu
  remainingText = remainingText.trim();
  if (remainingText && !hasIntroduction) {
    const formattedContent = processContent(remainingText);
    if (formattedContent.length > 0) {
      if (!hasAnySection) {
        // Nếu không có section nào khác, tạo section mặc định
        sections.push({
          icon: ShoppingBag,
          title: "Nguyên liệu cần chuẩn bị",
          content: formattedContent.filter((_, i) => i < 10) // Lấy các dòng đầu cho nguyên liệu
        });
        
        if (formattedContent.length > 10) {
          sections.push({
            icon: List,
            title: "Các bước thực hiện",
            content: formattedContent.filter((_, i) => i >= 10) // Lấy các dòng sau cho hướng dẫn
          });
        }
      } else {
        // Tạo section giới thiệu
        sections.unshift({
          icon: Info,
          title: "Giới thiệu",
          content: formattedContent
        });
      }
    }
  }

  // Nếu không có section nào, tạo section mặc định
  if (sections.length === 0) {
    const allContent = processContent(text);
    sections.push({
      icon: List,
      title: "Hướng dẫn nấu ăn",
      content: allContent
    });
  }

  return sections;
};

// Hàm xử lý nội dung của section
const processContent = (content: string): JSX.Element[] => {
  if (!content || content.trim() === "") return [];
  
  const lines = content.trim().split('\n');
  
  return lines.map((line, idx) => {
    line = line.trim();
    if (!line) return null;
    
    // Xử lý gạch đầu dòng số (1. 2. 3. etc)
    if (/^\d+\.\s+/.test(line)) {
      const match = line.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        const [, number, text] = match;
        return (
          <div key={`numbered-${idx}`} className="flex items-start mb-3">
            <div className="flex items-center justify-center bg-primary/10 rounded-full h-6 w-6 text-primary text-sm mt-0.5 mr-3 shrink-0">
              {number}
            </div>
            <div className="flex-1">{formatInlineElements(text)}</div>
          </div>
        );
      }
    }
    
    // Xử lý gạch đầu dòng (-) hoặc (*) hoặc (•)
    if (/^[-*•]\s+/.test(line)) {
      const text = line.replace(/^[-*•]\s+/, '');
      return (
        <div key={`bullet-${idx}`} className="flex items-start mb-3">
          <div className="flex h-5 w-5 items-center justify-center mr-2 shrink-0">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1">{formatInlineElements(text)}</div>
        </div>
      );
    }
    
    // Xử lý những dòng khác
    return (
      <p key={`para-${idx}`} className="mb-3 leading-relaxed">
        {formatInlineElements(line)}
      </p>
    );
  }).filter(Boolean) as JSX.Element[];
};

// Hàm định dạng các phần tử nội dòng (inline)
const formatInlineElements = (text: string): JSX.Element | string => {
  if (!text) return '';

  // Tìm và thay thế định dạng đậm
  const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);
  
  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return <strong key={i}>{content}</strong>;
        } else if (part.startsWith('__') && part.endsWith('__')) {
          const content = part.slice(2, -2);
          return <strong key={i}>{content}</strong>;
        }
        return part;
      })}
    </>
  );
};
