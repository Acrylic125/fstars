export function colorByIndex(
  index: number,
  config: {
    max: number;
    scheme:
      | "default"
      | "grayscale"
      | "blue-scale"
      | "red-scale"
      | "green-scale"
      | "blue-red-scale"
      | "blue-green-scale"
      | "red-green-scale";
  }
) {
  switch (config.scheme) {
    case "default":
      return {
        backgroundColor: `hsl(${(index * 360) / (config.max + 1)}, 95%, 85%)`,
        color: "#000000",
      };
    case "grayscale":
      const grayscaleIndex = Math.round((index / config.max) * 100);
      return {
        backgroundColor: `hsl(0, 0%, ${grayscaleIndex}%)`,
        color: grayscaleIndex > 50 ? "#000000" : "#ffffff",
      };
    case "blue-red-scale":
      // 240 to 360 blue to red
      const blueRedScale = 240 + (index / config.max) * 120;
      return {
        backgroundColor: `hsl(${blueRedScale}, 95%, 80%)`,
        color: "#000000",
      };
    case "blue-green-scale":
      // 120 to 240 blue to green
      const blueGreenScale = 120 + (index / config.max) * 120;
      return {
        backgroundColor: `hsl(${blueGreenScale}, 95%, 80%)`,
        color: "#000000",
      };
    case "red-green-scale":
      // 0 to 120 red to green
      const redGreenScale = (index / config.max) * 120;
      return {
        backgroundColor: `hsl(${redGreenScale}, 95%, 80%)`,
        color: "#000000",
      };
    case "blue-scale":
      const blueIndex = Math.round((index / config.max) * 80) + 10;
      return {
        backgroundColor: `hsl(200, 100%, ${blueIndex}%)`,
        color: blueIndex > 50 ? "#000000" : "#ffffff",
      };
    case "red-scale":
      const redIndex = Math.round((index / config.max) * 80) + 10;
      return {
        backgroundColor: `hsl(0, 100%, ${redIndex}%)`,
        color: redIndex > 50 ? "#000000" : "#ffffff",
      };
    case "green-scale":
      const greenIndex = Math.round((index / config.max) * 80) + 10;
      return {
        backgroundColor: `hsl(120, 100%, ${greenIndex}%)`,
        color: greenIndex > 50 ? "#000000" : "#ffffff",
      };
  }
}
