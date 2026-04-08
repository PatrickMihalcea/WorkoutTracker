-- Migrate existing equipment values to new naming
UPDATE exercises SET equipment = 'none' WHERE equipment = 'bodyweight';
UPDATE exercises SET equipment = 'resistance_band' WHERE equipment = 'band';
