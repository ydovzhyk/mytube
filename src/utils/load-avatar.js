const loadAvatar = async image => {
  try {
    const response = await fetch(image);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading avatar image:', error);
    return null;
  }
};

export default loadAvatar;
