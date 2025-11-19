import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CloudIcon, 
  SunIcon, 
  CloudRainIcon, 
  SnowflakeIcon, 
  ZapIcon,
  SearchIcon,
  MapPinIcon,
  ThermometerIcon,
  EyeIcon,
  GaugeIcon,
  WindIcon,
  DropletsIcon,
  SunriseIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import CurrentWeatherCard from '@/components/desktop/CurrentWeatherCard';
import HourlyForecast from '@/components/desktop/HourlyForecast';
import DailyForecast from '@/components/desktop/DailyForecast';
import WeatherMetrics from '@/components/desktop/WeatherMetrics';
import LocationSearch from '@/components/desktop/LocationSearch';
import { mockWeatherService, WeatherData } from '@/lib/weatherService';
import { cn } from '@/lib/utils';

const WeatherDashboard: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [currentLocation, setCurrentLocation] = useState('New York');
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundGradient, setBackgroundGradient] = useState('from-blue-400 via-purple-500 to-pink-500');

  const loadWeatherData = async (location: string) => {
    setIsLoading(true);
    try {
      const data = await mockWeatherService.getCurrentWeather(location);
      setWeatherData(data);
      setCurrentLocation(location);
      updateBackgroundGradient(data.current.condition.main);
    } catch (error) {
      console.error('Failed to load weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBackgroundGradient = (weatherCondition: string) => {
    const gradients = {
      Clear: 'from-amber-300 via-orange-400 to-pink-500',
      Clouds: 'from-gray-400 via-slate-500 to-blue-600',
      Rain: 'from-slate-600 via-gray-700 to-blue-800',
      Snow: 'from-blue-200 via-slate-300 to-gray-400',
      Thunderstorm: 'from-gray-800 via-purple-800 to-indigo-900',
    };
    
    const gradient = gradients[weatherCondition as keyof typeof gradients] || 'from-blue-400 via-purple-500 to-pink-500';
    setBackgroundGradient(gradient);
  };

  useEffect(() => {
    loadWeatherData(currentLocation);
  }, []);

  useEffect(() => {
    // Update background gradient with animation
    const rootElement = document.querySelector('body')?.parentElement as HTMLElement;
    if (rootElement) {
      rootElement.className = `min-h-screen bg-gradient-to-br ${backgroundGradient} transition-all duration-1000`;
    }
  }, [backgroundGradient]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <div className={cn(
        "fixed inset-0 bg-gradient-to-br transition-all duration-1000",
        backgroundGradient
      )}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="relative z-10 min-h-screen">
        <motion.div 
          className="container mx-auto px-4 py-6 max-w-6xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header with Location Search */}
          <motion.div 
            className="mb-6"
            variants={itemVariants}
          >
            <LocationSearch onLocationSelect={loadWeatherData} />
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 w-full rounded-2xl bg-white/20" />
                <Skeleton className="h-32 w-full rounded-2xl bg-white/20" />
                <Skeleton className="h-80 w-full rounded-2xl bg-white/20" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-96 w-full rounded-2xl bg-white/20" />
                <Skeleton className="h-32 w-full rounded-2xl bg-white/20" />
              </div>
            </div>
          ) : weatherData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Current Weather */}
                <motion.div variants={itemVariants}>
                  <CurrentWeatherCard weather={weatherData.current} />
                </motion.div>

                {/* Hourly Forecast */}
                <motion.div variants={itemVariants}>
                  <HourlyForecast hourlyData={weatherData.hourly} />
                </motion.div>

                {/* Daily Forecast */}
                <motion.div variants={itemVariants}>
                  <DailyForecast dailyData={weatherData.daily} />
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Weather Metrics */}
                <motion.div variants={itemVariants}>
                  <WeatherMetrics weather={weatherData.current} />
                </motion.div>

                {/* Additional Info Card */}
                <motion.div variants={itemVariants}>
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <SunriseIcon className="h-5 w-5" />
                        Weather Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Badge 
                          variant="secondary" 
                          className="bg-white/20 text-white border-white/30"
                        >
                          UV Index: {weatherData.current.uvIndex}
                        </Badge>
                        <p className="text-sm text-white/80">
                          {weatherData.current.uvIndex < 3 ? 'Low UV exposure' :
                           weatherData.current.uvIndex < 6 ? 'Moderate UV exposure' :
                           weatherData.current.uvIndex < 8 ? 'High UV exposure' : 'Very high UV exposure'}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-white/20">
                        <p className="text-sm text-white/80">
                          Last updated: {weatherData.current.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          ) : (
            <motion.div 
              className="text-center text-white"
              variants={itemVariants}
            >
              <p>Failed to load weather data. Please try again.</p>
              <Button 
                onClick={() => loadWeatherData(currentLocation)}
                className="mt-4"
                variant="secondary"
              >
                Retry
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WeatherDashboard;