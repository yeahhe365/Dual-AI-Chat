
export const generateUniqueId = (): string => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Return only the base64 part
    };
    reader.onerror = (error) => reject(error);
  });
};

export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

export const parseAttributes = (attrString: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)\s*=\s*"(.*?)"/g;
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
};
