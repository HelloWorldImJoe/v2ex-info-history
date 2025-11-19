export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  condition: WeatherCondition;
  timestamp: Date;
}

export interface HourlyForecast {
  time: Date;
  temperature: number;
  condition: WeatherCondition;
  precipitation: number;
  windSpeed: number;
}

export interface DailyForecast {
  date: Date;
  dayName: string;
  highTemp: number;
  lowTemp: number;
  condition: WeatherCondition;
  precipitation: number;
  windSpeed: number;
  humidity: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

const weatherConditions: WeatherCondition[] = [
  { id: 800, main: 'Clear', description: 'Clear sky', icon: '01d' },
  { id: 801, main: 'Clouds', description: 'Few clouds', icon: '02d' },
  { id: 802, main: 'Clouds', description: 'Scattered clouds', icon: '03d' },
  { id: 803, main: 'Clouds', description: 'Broken clouds', icon: '04d' },
  { id: 804, main: 'Clouds', description: 'Overcast clouds', icon: '04d' },
  { id: 500, main: 'Rain', description: 'Light rain', icon: '10d' },
  { id: 501, main: 'Rain', description: 'Moderate rain', icon: '10d' },
  { id: 502, main: 'Rain', description: 'Heavy rain', icon: '10d' },
  { id: 600, main: 'Snow', description: 'Light snow', icon: '13d' },
  { id: 601, main: 'Snow', description: 'Snow', icon: '13d' },
  { id: 200, main: 'Thunderstorm', description: 'Thunderstorm with light rain', icon: '11d' },
];

const cities = [
  'New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Dubai', 'Singapore', 
  'Los Angeles', 'Berlin', 'Amsterdam', 'Toronto', 'Mumbai', 'Bangkok'
];

const generateRandomWeatherCondition = (): WeatherCondition => {
  return weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
};

const generateRandomTemperature = (baseTemp: number, variance: number): number => {
  return Math.round(baseTemp + (Math.random() - 0.5) * variance);
};

export const mockWeatherService = {
  getCurrentWeather: async (location: string = 'New York'): Promise<WeatherData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const baseTemp = 22; // Base temperature in Celsius
    const condition = generateRandomWeatherCondition();
    const now = new Date();

    const current: CurrentWeather = {
      location,
      country: 'US',
      temperature: generateRandomTemperature(baseTemp, 10),
      feelsLike: generateRandomTemperature(baseTemp, 8),
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      windDirection: Math.floor(Math.random() * 360),
      pressure: Math.floor(Math.random() * 40) + 1000, // 1000-1040 hPa
      visibility: Math.floor(Math.random() * 5) + 10, // 10-15 km
      uvIndex: Math.floor(Math.random() * 11), // 0-10
      condition,
      timestamp: now,
    };

    // Generate hourly forecast for next 24 hours
    const hourly: HourlyForecast[] = [];
    for (let i = 1; i <= 24; i++) {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      hourly.push({
        time,
        temperature: generateRandomTemperature(baseTemp, 8),
        condition: generateRandomWeatherCondition(),
        precipitation: Math.floor(Math.random() * 100),
        windSpeed: Math.floor(Math.random() * 15) + 5,
      });
    }

    // Generate daily forecast for next 7 days
    const daily: DailyForecast[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dayName = dayNames[date.getDay()];
      const highTemp = generateRandomTemperature(baseTemp + 5, 8);
      const lowTemp = generateRandomTemperature(baseTemp - 5, 8);
      
      daily.push({
        date,
        dayName,
        highTemp: Math.max(highTemp, lowTemp),
        lowTemp: Math.min(highTemp, lowTemp),
        condition: generateRandomWeatherCondition(),
        precipitation: Math.floor(Math.random() * 100),
        windSpeed: Math.floor(Math.random() * 20) + 5,
        humidity: Math.floor(Math.random() * 30) + 50,
      });
    }

    return { current, hourly, daily };
  },

  searchLocations: async (query: string): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!query) return cities.slice(0, 5);
    
    const filtered = cities.filter(city => 
      city.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, 5);
  },
};