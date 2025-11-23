import { useState, useEffect } from 'react';

export const useTypewriterLoop = (words: string[], shouldStop: boolean) => {
  const [text, setText] = useState('');
  const [loopNum, setLoopNum] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    if (shouldStop) {
      if (text.length > 0) {
        const timer = setTimeout(() => {
          setText(prev => prev.slice(0, -1));
          setTypingSpeed(20);
        }, typingSpeed);
        return () => clearTimeout(timer);
      } else return;
    }

    const i = loopNum % words.length;
    const fullText = words[i];

    const handleType = () => {
      if (isDeleting) {
        setText(fullText.substring(0, text.length - 1));
        setTypingSpeed(50);
      } else {
        setText(fullText.substring(0, text.length + 1));
        setTypingSpeed(150);
      }

      if (!isDeleting && text === fullText) {
        setTypingSpeed(2000);
        setIsDeleting(true);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, shouldStop, typingSpeed, words]);

  return text;
};
