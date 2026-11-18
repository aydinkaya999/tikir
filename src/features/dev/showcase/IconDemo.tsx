import { Icon } from '../../../components/Icon/Icon';
import { iconNames } from '../../../components/Icon/iconSet';
import { Section } from './Section';
import styles from './Showcase.module.css';

export function IconDemo() {
  return (
    <Section name="Icon">
      <ul className={styles.iconGrid}>
        {iconNames.map((name) => (
          <li className={styles.iconCell} key={name}>
            <Icon name={name} />
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </Section>
  );
}
