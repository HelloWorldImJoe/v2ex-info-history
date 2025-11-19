import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPinIcon,
  ThermometerIcon,
  CloudIcon, 
  SunIcon, 
  CloudRainIcon, 
  SnowflakeIcon, 
  ZapIcon,
  WindIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrentWeather } from '@/lib/weatherService';
import { cn } from '@/lib/utils';

interface CurrentWeatherCardProps {
  weather: CurrentWeather;
}

const getWeatherIcon = (condition: string) => {
  const iconMap = {
    Clear: SunIcon,
    Clouds: CloudIcon,
    Rain: CloudRainIcon,
    Snow: SnowflakeIcon,
    Thunderstorm: ZapIcon,
  };
  
  return iconMap[condition as keyof typeof iconMap] || CloudIcon;
};

const getWeatherBackground = (condition: string) => {
  const backgroundMap = {
    Clear: 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20',
    Clouds: 'bg-gradient-to-br from-gray-400/20 to-slate-500/20',
    Rain: 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20',
    Snow: 'bg-gradient-to-br from-blue-200/20 to-slate-400/20',
    Thunderstorm: 'bg-gradient-to-br from-purple-600/20 to-gray-800/20',
  };
  
  return backgroundMap[condition as keyof typeof backgroundMap] || 'bg-gradient-to-br from-blue-400/20 to-purple-500/20';
};

const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({ weather }) => {
  const WeatherIcon = getWeatherIcon(weather.condition.main);
  
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const iconVariants = {
    hidden: { opacity: 0, rotate: -180 },
    visible: { 
      opacity: 1, 
      rotate: 0,
      transition: { 
        duration: 0.8, 
        ease: "easeOut",
        delay: 0.2
      }
    }
  };

  const tempVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        delay: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className={cn(
        "relative overflow-hidden border-white/20 text-white backdrop-blur-md",
        getWeatherBackground(weather.condition.main)
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
        
        <CardContent className="relative p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <motion.div 
                className="flex items-center gap-2 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <MapPinIcon className="h-5 w-5 text-white/80" />
                <h2 className="text-xl font-semibold text-white">
                  {weather.location}
                </h2>
                <Badge 
                  variant="secondary" 
                  className="bg-white/20 text-white border-white/30 text-xs"
                >
                  {weather.country}
                </Badge>
              </motion.div>
              
              <motion.p 
                className="text-white/80 capitalize"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {weather.condition.description}
              </motion.p>
            </div>
            
            <motion.div
              variants={iconVariants}
              className="text-white/90"
            >
              <WeatherIcon className="h-16 w-16" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Temperature */}
            <motion.div 
              className="md:col-span-2"
              variants={tempVariants}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-light text-white">
                  {weather.temperature}
                </span>
                <span className="text-2xl text-white/80">°C</span>
              </div>
              
              <motion.div 
                className="flex items-center gap-2 mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ThermometerIcon className="h-4 w-4 text-white/60" />
                <span className="text-white/80">
                  Feels like {weather.feelsLike}°C
                </span>
              </motion.div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Wind</span>
                <div className="flex items-center gap-1">
                  <WindIcon className="h-4 w-4 text-white/60" />
                  <span className="text-white font-medium">
                    {weather.windSpeed} km/h
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Humidity</span>
                <span className="text-white font-medium">
                  {weather.humidity}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-sm">Pressure</span>
                <span className="text-white font-medium">
                  {weather.pressure} hPa
                </span>
              </div>
            </motion.div>
          </div>

          {/* Animated Weather Effects */}
          {weather.condition.main === 'Rain' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-4 bg-blue-300/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10px`,
                  }}
                  animate={{
                    y: [0, 400],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: Math.random() * 1,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          )}

          {weather.condition.main === 'Snow' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/40 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10px`,
                  }}
                  animate={{
                    y: [0, 400],
                    x: [0, Math.sin(i) * 20],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CurrentWeatherCard;