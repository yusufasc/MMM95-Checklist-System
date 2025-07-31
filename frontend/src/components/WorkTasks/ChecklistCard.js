import React from 'react';
import {
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
} from '@mui/material';

const ChecklistCard = ({ item, index, onCheck }) => {
  const isCompleted = item.tamamlandi || item.yapildi;

  return (
    <Card sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent>
        <FormControlLabel
          control={
            <Checkbox checked={isCompleted} onChange={() => onCheck(index)} />
          }
          label={
            <Box>
              <Typography variant='body1'>
                {item.soru || item.madde || 'Checklist Maddesi'}
              </Typography>
              {item.puan && (
                <Typography variant='caption' color='text.secondary'>
                  Puan: {item.puan}
                </Typography>
              )}
            </Box>
          }
        />
      </CardContent>
    </Card>
  );
};

export default ChecklistCard;
