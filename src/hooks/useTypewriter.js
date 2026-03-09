import { useEffect, useState } from "react";

export function useTypewriter(words) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const timeout = setTimeout(() => {
      if (isDeleting) {
        setText(currentWord.substring(0, text.length - 1));

        if (text === "") {
          setIsDeleting(false);
          setWordIndex((current) => (current + 1) % words.length);
        }

        return;
      }

      if (text === currentWord) {
        setIsDeleting(true);
        return;
      }

      setText(currentWord.substring(0, text.length + 1));
    }, isDeleting ? 40 : text === currentWord ? 2000 : 100);

    return () => clearTimeout(timeout);
  }, [isDeleting, text, wordIndex, words]);

  return text;
}
