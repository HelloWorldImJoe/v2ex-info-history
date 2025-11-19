import React from 'react';
import { motion } from 'framer-motion';
import { 
  CloudIcon, 
  SunIcon, 
  CloudRainIcon, 
  SnowflakeIcon, 
  ZapIcon,
  CalendarIcon,
  DropletsIcon,
  WindIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DailyForecast as DailyForecastType } from '@/lib/weatherService';
import { cn } from '@/lib/utils';

interface DailyForecastProps {
  dailyData: DailyForecastType[];
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

const getWeatherColor = (condition: string) => {
  const colorMap = {
    Clear: 'text-yellow-300',
    Clouds: 'text-gray-300',
    Rain: 'text-blue-300',
    Snow: 'text-blue-100',
    Thunderstorm: 'text-purple-300',
  };
  
  return colorMap[condition as keyof typeof colorMap] || 'text-gray-300';
};

const DailyForecast: React.FC<DailyForecastProps> = ({ dailyData }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      }
    },
  };

  const tempBarVariants = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2,
      }
    },
  };

  const maxTemp = Math.max(...dailyData.map(day => day.highTemp));
  const minTemp = Math.min(...dailyData.map(day => day.lowTemp));
  const tempRange = maxTemp - minTemp;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CalendarIcon className="h-5 w-5" />
            7-Day Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dailyData.map((day, index) => {
            const WeatherIcon = getWeatherIcon(day.condition.main);
            const isToday = index === 0;
            const tempPercent = tempRange > 0 ? ((day.highTemp - minTemp) / tempRange) * 100 : 50;
            
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  x: 5,
                  transition: { duration: 0.2 }
                }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
                  "backdrop-blur-sm border border-white/10",
                  isToday 
                    ? "bg-white/20 border-white/30" 
                    : "bg-white/5 hover:bg-white/10"
                )}
              >
                {/* Day Name */}
                <div className="flex-shrink-0 w-12">
                  <motion.div 
                    className={cn(
                      "font-semibold text-sm",
                      isToday ? "text-white" : "text-white/80"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    {isToday ? 'Today' : day.dayName}
                  </motion.div>
                </div>

                {/* Weather Icon */}
                <motion.div
                  className={cn("flex-shrink-0", getWeatherColor(day.condition.main))}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.5,
                    delay: index * 0.08 + 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 10,
                    transition: { duration: 0.2 }
                  }}
                >
                  <WeatherIcon className="h-6 w-6" />
                </motion.div>

                {/* Condition Description */}
                <div className="flex-1 min-w-0">
                  <motion.div 
                    className="text-white/90 text-sm font-medium capitalize truncate"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 + 0.2 }}
                  >
                    {day.condition.description}
                  </motion.div>
                  
                  {/* Weather Details */}
                  <div className="flex items-center gap-3 mt-1">
                    {day.precipitation > 0 && (
                      <motion.div 
                        className="flex items-center gap-1 text-xs text-blue-200"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.08 + 0.3 }}
                      >
                        <DropletsIcon className="h-3 w-3" />
                        <span>{day.precipitation}%</span>
                      </motion.div>
                    )}
                    
                    <motion.div 
                      className="flex items-center gap-1 text-xs text-white/60"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.08 + 0.4 }}
                    >
                      <WindIcon className="h-3 w-3" />
                      <span>{day.windSpeed} km/h</span>
                    </motion.div>
                  </div>
                </div>

                {/* Temperature Range */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Visual Temperature Bar */}
                  <div className="hidden sm:block w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-400 to-orange-400 rounded-full origin-left"
                      variants={tempBarVariants}
                      style={{ width: `${tempPercent}%` }}
                    />
                  </div>

                  {/* Temperature Text */}
                  <div className="flex items-center gap-2 text-right">
                    <motion.span 
                      className="text-white/60 text-sm"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 + 0.3 }}
                    >
                      {day.lowTemp}°
                    </motion.span>
                    
                    <motion.span 
                      className="text-white font-semibold"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 + 0.4 }}
                    >
                      {day.highTemp}°
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DailyForecast;