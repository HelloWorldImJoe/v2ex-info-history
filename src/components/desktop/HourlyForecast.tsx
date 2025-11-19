import React from 'react';
import { motion } from 'framer-motion';
import { 
  CloudIcon, 
  SunIcon, 
  CloudRainIcon, 
  SnowflakeIcon, 
  ZapIcon,
  ClockIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { HourlyForecast as HourlyForecastType } from '@/lib/weatherService';
import { cn } from '@/lib/utils';

interface HourlyForecastProps {
  hourlyData: HourlyForecastType[];
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

const getTimeString = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric',
    hour12: true 
  });
};

const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourlyData }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      }
    },
  };

  const iconVariants = {
    hover: { 
      scale: 1.1,
      rotate: 5,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ClockIcon className="h-5 w-5" />
            24-Hour Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {hourlyData.slice(0, 24).map((hour, index) => {
                const WeatherIcon = getWeatherIcon(hour.condition.main);
                const isCurrentHour = index === 0;
                
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-xl transition-colors duration-200",
                      "min-w-[80px] backdrop-blur-sm",
                      isCurrentHour 
                        ? "bg-white/20 border border-white/30" 
                        : "bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <motion.div 
                      className="text-sm font-medium text-white/90"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {isCurrentHour ? 'Now' : getTimeString(hour.time)}
                    </motion.div>
                    
                    <motion.div
                      variants={iconVariants}
                      whileHover="hover"
                      className="text-white/90"
                    >
                      <WeatherIcon className="h-6 w-6" />
                    </motion.div>
                    
                    <motion.div 
                      className="text-lg font-semibold text-white"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        delay: index * 0.05 + 0.2,
                        duration: 0.3
                      }}
                    >
                      {hour.temperature}°
                    </motion.div>
                    
                    {hour.precipitation > 0 && (
                      <motion.div 
                        className="text-xs text-blue-200"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: index * 0.05 + 0.3,
                          duration: 0.2
                        }}
                      >
                        {hour.precipitation}%
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="mt-2" />
          </ScrollArea>
          
          {/* Temperature trend visualization */}
          <motion.div 
            className="mt-4 pt-4 border-t border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Temperature Range</span>
              <span>
                {Math.min(...hourlyData.slice(0, 24).map(h => h.temperature))}° - {Math.max(...hourlyData.slice(0, 24).map(h => h.temperature))}°
              </span>
            </div>
            
            <motion.div 
              className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <div className="h-full bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 rounded-full" />
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HourlyForecast;