import React from 'react';
import { motion } from 'framer-motion';
import { 
  ThermometerIcon,
  EyeIcon,
  GaugeIcon,
  WindIcon,
  DropletsIcon,
  CompassIcon,
  ActivityIcon,
  SunIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CurrentWeather } from '@/lib/weatherService';
import { cn } from '@/lib/utils';

interface WeatherMetricsProps {
  weather: CurrentWeather;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress?: number;
  maxValue?: number;
  unit?: string;
  color?: string;
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  icon, 
  label, 
  value, 
  progress, 
  maxValue, 
  unit, 
  color = 'bg-blue-500',
  delay = 0 
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        delay,
        ease: "easeOut",
      }
    },
  };

  const progressVariants = {
    hidden: { scaleX: 0 },
    visible: { 
      scaleX: 1,
      transition: {
        duration: 0.8,
        delay: delay + 0.2,
        ease: "easeOut",
      }
    },
  };

  const iconVariants = {
    hidden: { rotate: -180, opacity: 0 },
    visible: { 
      rotate: 0, 
      opacity: 1,
      transition: {
        duration: 0.6,
        delay: delay + 0.1,
        type: "spring",
        stiffness: 200
      }
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 }
      }}
      className="relative"
    >
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        
        <CardContent className="relative p-4">
          <div className="flex items-center justify-between mb-3">
            <motion.div 
              className="text-white/80"
              variants={iconVariants}
            >
              {icon}
            </motion.div>
            
            <motion.div 
              className="text-right"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: delay + 0.2 }}
            >
              <div className="text-2xl font-bold text-white">
                {value}
              </div>
              {unit && (
                <div className="text-xs text-white/60">
                  {unit}
                </div>
              )}
            </motion.div>
          </div>
          
          <motion.div 
            className="text-sm text-white/80 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: delay + 0.3 }}
          >
            {label}
          </motion.div>
          
          {progress !== undefined && maxValue && (
            <div className="space-y-1">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", color)}
                  variants={progressVariants}
                  style={{ width: `${(progress / maxValue) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/60">
                <span>0</span>
                <span>{maxValue}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(degrees / 22.5) % 16];
};

const getUVIndexCategory = (uvIndex: number): { category: string; color: string } => {
  if (uvIndex <= 2) return { category: 'Low', color: 'bg-green-500' };
  if (uvIndex <= 5) return { category: 'Moderate', color: 'bg-yellow-500' };
  if (uvIndex <= 7) return { category: 'High', color: 'bg-orange-500' };
  if (uvIndex <= 10) return { category: 'Very High', color: 'bg-red-500' };
  return { category: 'Extreme', color: 'bg-purple-500' };
};

const getVisibilityCategory = (visibility: number): string => {
  if (visibility >= 10) return 'Excellent';
  if (visibility >= 5) return 'Good';
  if (visibility >= 2) return 'Moderate';
  return 'Poor';
};

const WeatherMetrics: React.FC<WeatherMetricsProps> = ({ weather }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const uvIndexInfo = getUVIndexCategory(weather.uvIndex);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ActivityIcon className="h-5 w-5" />
            Weather Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Feels Like Temperature */}
            <MetricCard
              icon={<ThermometerIcon className="h-5 w-5" />}
              label="Feels Like"
              value={weather.feelsLike.toString()}
              unit="°C"
              delay={0}
            />

            {/* Humidity */}
            <MetricCard
              icon={<DropletsIcon className="h-5 w-5" />}
              label="Humidity"
              value={weather.humidity.toString()}
              unit="%"
              progress={weather.humidity}
              maxValue={100}
              color="bg-blue-500"
              delay={0.1}
            />

            {/* Wind Speed */}
            <MetricCard
              icon={<WindIcon className="h-5 w-5" />}
              label={`Wind ${getWindDirection(weather.windDirection)}`}
              value={weather.windSpeed.toString()}
              unit="km/h"
              progress={weather.windSpeed}
              maxValue={50}
              color="bg-gray-500"
              delay={0.2}
            />

            {/* Pressure */}
            <MetricCard
              icon={<GaugeIcon className="h-5 w-5" />}
              label="Pressure"
              value={weather.pressure.toString()}
              unit="hPa"
              progress={weather.pressure - 980}
              maxValue={60}
              color="bg-purple-500"
              delay={0.3}
            />

            {/* Visibility */}
            <MetricCard
              icon={<EyeIcon className="h-5 w-5" />}
              label={`Visibility (${getVisibilityCategory(weather.visibility)})`}
              value={weather.visibility.toString()}
              unit="km"
              progress={weather.visibility}
              maxValue={20}
              color="bg-cyan-500"
              delay={0.4}
            />

            {/* UV Index */}
            <MetricCard
              icon={<SunIcon className="h-5 w-5" />}
              label={`UV Index (${uvIndexInfo.category})`}
              value={weather.uvIndex.toString()}
              progress={weather.uvIndex}
              maxValue={11}
              color={uvIndexInfo.color}
              delay={0.5}
            />
          </div>

          {/* Wind Direction Compass */}
          <motion.div
            className="mt-6 p-4 bg-white/5 rounded-xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CompassIcon className="h-4 w-4 text-white/80" />
                <span className="text-sm text-white/80">Wind Direction</span>
              </div>
              <span className="text-white font-semibold">
                {weather.windDirection}° {getWindDirection(weather.windDirection)}
              </span>
            </div>
            
            <div className="relative">
              <motion.div
                className="w-12 h-12 mx-auto bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="text-white"
                  animate={{ rotate: weather.windDirection }}
                  transition={{ duration: 1, delay: 0.8 }}
                >
                  <CompassIcon className="h-6 w-6" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeatherMetrics;