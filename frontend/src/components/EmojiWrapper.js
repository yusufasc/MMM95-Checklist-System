import React from 'react';

const EmojiWrapper = ({ emoji, label, ...props }) => {
  return (
    <span role='img' aria-label={label} {...props}>
      {emoji}
    </span>
  );
};

export default EmojiWrapper;
