
interface TestimonialCardProps {
  text: string;
  name: string;
  role: string;
}

const TestimonialCard = ({ text, name, role }: TestimonialCardProps) => {
  return (
    <div className="bg-slate-50 p-6 rounded-xl">
      <div className="flex items-center space-x-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        ))}
      </div>
      <p className="text-slate-700 mb-4">{text}</p>
      <div className="font-medium">{name}</div>
      <div className="text-sm text-muted-foreground">{role}</div>
    </div>
  );
};

export default TestimonialCard;
