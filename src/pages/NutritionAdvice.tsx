
import { useEffect, useState } from "react";
import { ArrowLeft, SendIcon, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const NutritionAdvice = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý dinh dưỡng AI. Bạn có thể hỏi tôi về chế độ ăn uống, thực phẩm lành mạnh, hoặc lời khuyên dinh dưỡng phù hợp với sức khỏe của bạn."
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkPremiumStatus = async () => {
      setIsLoading(true);
      try {
        // Fetch premium status from profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        setIsPremium(profileData?.is_premium || false);
        
        if (!profileData?.is_premium) {
          toast({
            variant: "destructive",
            title: "Tính năng giới hạn",
            description: "Bạn cần nâng cấp tài khoản Premium để sử dụng tính năng này."
          });
        }
      } catch (error) {
        console.error("Error checking premium status:", error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user, toast]);

  useEffect(() => {
    // Redirect non-premium users after checking status
    if (isPremium === false && !isLoading) {
      navigate('/premium');
    }
  }, [isPremium, isLoading, navigate]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;
    
    const userMessage = { role: "user" as const, content: inputMessage.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsProcessing(true);
    
    try {
      // Call nutrition AI chat function
      const response = await supabase.functions.invoke('nutrition-ai-chat', {
        body: { 
          message: userMessage.content,
          userId: user?.id 
        }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      // Add assistant response to chat
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: response.data.answer || "Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này." }
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể gửi tin nhắn. Vui lòng thử lại sau."
      });
      
      // Add error message to chat
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: "Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn của bạn. Vui lòng thử lại sau." }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isPremium === false) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center space-x-2 text-primary hover:text-primary/80">
            <ArrowLeft className="h-5 w-5" />
            <span>Quay lại</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="text-3xl font-bold mb-6">Tư vấn dinh dưỡng</h1>
        
        <div className="flex-1 flex flex-col bg-card rounded-lg border overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang soạn câu trả lời...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t p-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }} 
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Đặt câu hỏi về dinh dưỡng..."
                className="flex-1 px-3 py-2 rounded-md border bg-background"
                disabled={isProcessing}
              />
              <button 
                type="submit" 
                className="p-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                disabled={!inputMessage.trim() || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SendIcon className="h-5 w-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NutritionAdvice;
