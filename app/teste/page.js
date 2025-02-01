import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const ComponentSelector = () => {
  const [activeComponent, setActiveComponent] = useState('X');

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button
          onClick={() => setActiveComponent('X')}
          variant={activeComponent === 'X' ? 'default' : 'outline'}
        >
          Show Component X
        </Button>
        <Button
          onClick={() => setActiveComponent('Y')}
          variant={activeComponent === 'Y' ? 'default' : 'outline'}
        >
          Show Component Y
        </Button>
      </div>

      <div className="mt-4">
        {activeComponent === 'X' ? <ComponentX /> : <ComponentY />}
      </div>
    </div>
  );
};

export default ComponentSelector;