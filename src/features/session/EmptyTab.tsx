// The album's and the studio's empty state (docs/planlar/faz-2b.md, karar 18): one sentence in a
// card and the way back to the road. TODO(design)
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import styles from './EmptyTab.module.css';
import { childPaths } from './paths';

export function EmptyTab({ text, back }: { text: string; back: string }) {
  const navigate = useNavigate();
  return (
    <Card className={styles.card}>
      <p className={styles.text}>{text}</p>
      <Button
        variant="secondary"
        icon="route"
        onClick={() => {
          void navigate(childPaths.road);
        }}
      >
        {back}
      </Button>
    </Card>
  );
}
