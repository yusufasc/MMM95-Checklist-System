import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Slider,
  ButtonGroup,
  Button,
  TextField,
  useTheme,
  alpha,
  Collapse,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';

/**
 * Mobile-Optimized Scoring Component
 * Touch-friendly design with multiple input methods
 */
const MobileScoreInput = ({
  item,
  score = 0,
  maxScore = 10,
  onScoreChange,
  onCommentChange,
  comment = '',
  disabled = false,
  variant = 'slider', // 'slider', 'stars', 'buttons', 'quick'
}) => {
  const theme = useTheme();
  const [showComment, setShowComment] = useState(false);
  const [localComment, setLocalComment] = useState(comment);

  const handleScoreChange = newScore => {
    if (disabled) {
      return;
    }
    onScoreChange(Math.max(0, Math.min(maxScore, newScore)));
  };

  const handleCommentSubmit = () => {
    onCommentChange(localComment);
    setShowComment(false);
  };

  const getScoreColor = score => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) {
      return theme.palette.success.main;
    }
    if (percentage >= 60) {
      return theme.palette.warning.main;
    }
    return theme.palette.error.main;
  };

  const renderSliderInput = () => (
    <Box sx={{ px: 2, py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography
          variant='h6'
          sx={{ minWidth: 40, fontSize: '1.25rem', fontWeight: 700 }}
        >
          {score}
        </Typography>
        <Chip
          label={`/${maxScore}`}
          size='small'
          sx={{
            ml: 1,
            bgcolor: alpha(getScoreColor(score), 0.1),
            color: getScoreColor(score),
          }}
        />
      </Box>

      <Slider
        value={score}
        onChange={(_, value) => handleScoreChange(value)}
        min={0}
        max={maxScore}
        step={1}
        disabled={disabled}
        sx={{
          color: getScoreColor(score),
          height: 8,
          '& .MuiSlider-thumb': {
            height: 24,
            width: 24,
            '&:hover': {
              boxShadow: `0 0 0 8px ${alpha(getScoreColor(score), 0.16)}`,
            },
          },
          '& .MuiSlider-track': {
            height: 8,
            borderRadius: 4,
          },
          '& .MuiSlider-rail': {
            height: 8,
            borderRadius: 4,
            backgroundColor: alpha(theme.palette.grey[500], 0.2),
          },
        }}
      />
    </Box>
  );

  const renderStarsInput = () => (
    <Box sx={{ display: 'flex', gap: 1, px: 2, py: 1 }}>
      {[...Array(maxScore)].map((_, index) => (
        <IconButton
          key={index}
          onClick={() => handleScoreChange(index + 1)}
          disabled={disabled}
          sx={{
            p: 0.5,
            color:
              index < score
                ? theme.palette.warning.main
                : theme.palette.grey[300],
            '&:hover': {
              color: theme.palette.warning.main,
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {index < score ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      ))}
      <Typography
        variant='body2'
        sx={{ ml: 2, alignSelf: 'center', fontWeight: 600 }}
      >
        {score}/{maxScore}
      </Typography>
    </Box>
  );

  const renderButtonsInput = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1 }}>
      <IconButton
        onClick={() => handleScoreChange(score - 1)}
        disabled={disabled || score <= 0}
        sx={{
          bgcolor: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.main,
          '&:hover': {
            bgcolor: alpha(theme.palette.error.main, 0.2),
          },
        }}
      >
        <RemoveIcon />
      </IconButton>

      <Box
        sx={{
          minWidth: 80,
          textAlign: 'center',
          py: 1,
          px: 2,
          borderRadius: 2,
          bgcolor: alpha(getScoreColor(score), 0.1),
          border: `2px solid ${getScoreColor(score)}`,
        }}
      >
        <Typography
          variant='h6'
          sx={{ color: getScoreColor(score), fontWeight: 700 }}
        >
          {score}/{maxScore}
        </Typography>
      </Box>

      <IconButton
        onClick={() => handleScoreChange(score + 1)}
        disabled={disabled || score >= maxScore}
        sx={{
          bgcolor: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.main,
          '&:hover': {
            bgcolor: alpha(theme.palette.success.main, 0.2),
          },
        }}
      >
        <AddIcon />
      </IconButton>
    </Box>
  );

  const renderQuickInput = () => (
    <Box sx={{ px: 2, py: 1 }}>
      <ButtonGroup
        fullWidth
        variant='outlined'
        sx={{
          '& .MuiButton-root': {
            minHeight: 48,
            fontSize: '1rem',
            fontWeight: 600,
          },
        }}
      >
        <Button
          onClick={() => handleScoreChange(Math.floor(maxScore * 0.3))}
          disabled={disabled}
          sx={{
            color: theme.palette.error.main,
            borderColor: theme.palette.error.main,
            '&:hover': {
              bgcolor: alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          <ThumbDownIcon sx={{ mr: 1 }} />
          Düşük
        </Button>
        <Button
          onClick={() => handleScoreChange(Math.floor(maxScore * 0.7))}
          disabled={disabled}
          sx={{
            color: theme.palette.warning.main,
            borderColor: theme.palette.warning.main,
            '&:hover': {
              bgcolor: alpha(theme.palette.warning.main, 0.1),
            },
          }}
        >
          Orta
        </Button>
        <Button
          onClick={() => handleScoreChange(maxScore)}
          disabled={disabled}
          sx={{
            color: theme.palette.success.main,
            borderColor: theme.palette.success.main,
            '&:hover': {
              bgcolor: alpha(theme.palette.success.main, 0.1),
            },
          }}
        >
          <ThumbUpIcon sx={{ mr: 1 }} />
          Yüksek
        </Button>
      </ButtonGroup>
    </Box>
  );

  const renderScoreInput = () => {
    switch (variant) {
      case 'stars':
        return renderStarsInput();
      case 'buttons':
        return renderButtonsInput();
      case 'quick':
        return renderQuickInput();
      default:
        return renderSliderInput();
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        border: '1px solid',
        borderColor: disabled
          ? theme.palette.grey[300]
          : alpha(getScoreColor(score), 0.3),
        borderRadius: 3,
        overflow: 'hidden',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Item Title */}
        <Typography
          variant='subtitle1'
          sx={{
            fontWeight: 600,
            mb: 2,
            fontSize: { xs: '0.95rem', sm: '1rem' },
            lineHeight: 1.3,
          }}
        >
          {item?.ad || item?.baslik || 'Puanlama Maddesi'}
        </Typography>

        {/* Score Input */}
        {renderScoreInput()}

        {/* Comment Section */}
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<CommentIcon />}
            onClick={() => setShowComment(!showComment)}
            size='small'
            sx={{
              fontSize: '0.8rem',
              color: theme.palette.text.secondary,
            }}
          >
            {comment ? 'Yorumu Düzenle' : 'Yorum Ekle'}
          </Button>

          <Collapse in={showComment}>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder='Puanlama yorumunuzu yazın...'
                value={localComment}
                onChange={e => setLocalComment(e.target.value)}
                size='small'
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mt: 1,
                  justifyContent: 'flex-end',
                }}
              >
                <Button size='small' onClick={() => setShowComment(false)}>
                  İptal
                </Button>
                <Button
                  size='small'
                  variant='contained'
                  onClick={handleCommentSubmit}
                >
                  Kaydet
                </Button>
              </Box>
            </Box>
          </Collapse>

          {comment && !showComment && (
            <Typography
              variant='body2'
              sx={{
                mt: 1,
                p: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 1,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                fontSize: '0.85rem',
              }}
            >
              {comment}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MobileScoreInput;
