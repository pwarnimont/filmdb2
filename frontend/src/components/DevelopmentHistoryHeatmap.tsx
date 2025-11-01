import {useMemo} from 'react';
import {Box, Paper, Skeleton, Stack, Tooltip, Typography} from '@mui/material';
import {alpha, useTheme} from '@mui/material/styles';

type ActivityEntry = {
  total: number;
  shot: number;
  developed: number;
};

export type DevelopmentHistoryMap = Record<string, ActivityEntry>;

export interface DevelopmentHistoryHeatmapProps {
  data?: DevelopmentHistoryMap;
  loading?: boolean;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function DevelopmentHistoryHeatmap({data, loading}: DevelopmentHistoryHeatmapProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const today = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }, []);

  const {weeks, maxCount, hasActivity} = useMemo(() => {
    const activity = data ?? {};
    const endDate = new Date(today);
    const endOffset = 6 - endDate.getDay();
    endDate.setDate(endDate.getDate() + endOffset);
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (7 * 53 - 1));
    startDate.setHours(0, 0, 0, 0);

    const constructed: Array<
      Array<
        ActivityEntry & {
          date: Date;
        }
      >
    > = [];
    let max = 0;
    let seenActivity = false;

    for (let cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      const bucketDate = new Date(cursor);
      const key = toDateKey(bucketDate);
      const entry = activity[key] ?? {total: 0, shot: 0, developed: 0};

      if (bucketDate.getDay() === 0 || !constructed.length) {
        constructed.push([]);
      }

      constructed[constructed.length - 1].push({
        ...entry,
        date: bucketDate
      });

      if (entry.total > 0) {
        seenActivity = true;
        max = Math.max(max, entry.total);
      }
    }

    // Ensure each week has a full 7 day set for grid alignment.
    for (const week of constructed) {
      while (week.length < 7) {
        const fillerDate = new Date(week[week.length - 1].date);
        fillerDate.setDate(fillerDate.getDate() + 1);
        week.push({
          total: 0,
          shot: 0,
          developed: 0,
          date: fillerDate
        });
      }
    }

    return {
      weeks: constructed,
      maxCount: max,
      hasActivity: seenActivity
    };
  }, [data, today]);

  const getColor = (count: number) => {
    if (!hasActivity || count === 0 || maxCount === 0) {
      return isDark ? alpha(theme.palette.common.white, 0.08) : alpha(theme.palette.text.primary, 0.05);
    }
    const bucketCount = 4;
    const bucket = Math.ceil((count / maxCount) * bucketCount);
    const level = Math.min(bucket, bucketCount);
    const alphaLevels = isDark ? [0.35, 0.5, 0.65, 0.8] : [0.18, 0.34, 0.5, 0.66];
    return alpha(theme.palette.success.main, alphaLevels[level - 1]);
  };

  const renderTooltipTitle = (entry: ActivityEntry, date: Date) => {
    const formattedDate = formatFullDate(date);
    if (date > today) {
      return (
        <Typography variant="caption" component="div">
          Scheduled view for {formattedDate}
        </Typography>
      );
    }
    if (entry.total === 0) {
      return (
        <Typography variant="caption" component="div">
          No activity recorded on {formattedDate}
        </Typography>
      );
    }
    const entriesLabel = `${entry.total} ${entry.total === 1 ? 'entry' : 'entries'}`;
    return (
      <Stack spacing={0.25}>
        <Typography variant="caption" component="div" sx={{fontWeight: 600}}>
          {entriesLabel}
        </Typography>
        <Typography variant="caption" component="div">
          {formattedDate}
        </Typography>
        <Typography variant="caption" component="div">
          Shot: {entry.shot || 0}
        </Typography>
        <Typography variant="caption" component="div">
          Developed: {entry.developed || 0}
        </Typography>
      </Stack>
    );
  };

  if (loading) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: {xs: 2, md: 3},
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.9 : 0.92)
        }}
      >
        <Skeleton variant="rounded" height={140} />
      </Paper>
    );
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels = weeks.map((week, index) => {
    const firstDay = week[0]?.date;
    if (!firstDay) {
      return '';
    }
    const month = firstDay.getMonth();
    const prevFirst = weeks[index - 1]?.[0]?.date;
    if (index === 0 || !prevFirst || month !== prevFirst.getMonth()) {
      return firstDay.toLocaleString(undefined, {month: 'short'});
    }
    return '';
  });

  const cellSize = 14;
  const labelColumnWidth = cellSize * 2;
  const gridTemplateColumns = `${labelColumnWidth}px repeat(${weeks.length}, ${cellSize}px)`;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: {xs: 2, md: 3},
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.9 : 0.92),
        borderColor: alpha(theme.palette.divider, isDark ? 0.5 : 0.2)
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h6" sx={{fontWeight: 600}}>
          Shooting & Development Activity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Activity from the past 53 weeks. Hover a day to view how many rolls were shot or developed.
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns,
            gridTemplateRows: `auto repeat(7, ${cellSize}px)`,
            columnGap: 0.5,
            rowGap: 0.5,
            alignItems: 'center'
          }}
        >
          <Box />
          {weeks.map((_, index) => (
            <Typography
              variant="caption"
              key={`month-${index}`}
              align="center"
              sx={{color: alpha(theme.palette.text.primary, monthLabels[index] ? 0.7 : 0)}}
            >
              {monthLabels[index]}
            </Typography>
          ))}
          {dayNames.map((dayLabel, dayIndex) => {
            const showLabel = dayIndex % 2 === 1;
            return (
              <Typography
                variant="caption"
                key={`label-${dayLabel}`}
                sx={{
                  justifySelf: 'end',
                  width: `${labelColumnWidth}px`,
                  color: alpha(theme.palette.text.primary, showLabel ? 0.6 : 0),
                  lineHeight: 1
                }}
              >
                {showLabel ? dayLabel : ''}
              </Typography>
            );
          })}
          {dayNames.flatMap((_day, dayIndex) =>
            weeks.map((week, weekIndex) => {
              const entry = week[dayIndex];
              const dateKey = entry ? toDateKey(entry.date) : `${weekIndex}-${dayIndex}`;
              return (
                <Tooltip
                  key={`cell-${dateKey}`}
                  arrow
                  title={entry ? renderTooltipTitle(entry, entry.date) : ''}
                  placement="top"
                  describeChild
                >
                  <Box
                    sx={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      borderRadius: '4px',
                      backgroundColor: entry ? getColor(entry.total) : getColor(0),
                      border:
                        entry && entry.date.getTime() === today.getTime()
                          ? `1px solid ${alpha(theme.palette.text.primary, 0.4)}`
                          : '1px solid transparent',
                      transition: 'transform 120ms ease',
                      '&:hover': {
                        transform: 'scale(1.08)'
                      }
                    }}
                  />
                </Tooltip>
              );
            })
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
          <Typography variant="caption" color="text.secondary">
            Less
          </Typography>
          {[0, 1, 2, 3, 4].map((level) => {
            const value = level === 0 ? 0 : Math.ceil((maxCount / 4) * level);
            return (
              <Box
                key={`legend-${level}`}
                sx={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  borderRadius: '4px',
                  backgroundColor: getColor(value),
                  border: '1px solid transparent'
                }}
              />
            );
          })}
          <Typography variant="caption" color="text.secondary">
            More
          </Typography>
        </Stack>
        {!hasActivity && (
          <Typography variant="body2" color="text.secondary">
            No shooting or development activity recorded yet.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
