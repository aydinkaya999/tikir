import { ButtonDemo, IconButtonDemo } from './ButtonDemo';
import {
  CheckboxDemo,
  OptionCardDemo,
  SegmentedControlDemo,
  SwitchDemo,
  TextAreaDemo,
  TextFieldDemo,
} from './FormDemo';
import { IconDemo } from './IconDemo';
import { BookCoverDemo, CompanionDemo, MonsterDemo, TileDemo } from './IllustrationDemo';
import { MicButtonDemo, StepTilesDemo } from './SessionDemo';
import styles from './Showcase.module.css';
import { CardDemo, ChipDemo, PageCardDemo, SpeechBubbleDemo } from './SurfaceDemo';

/**
 * /gelistirme/vitrin: every component of docs/tasarim-sistemi.md in every state. Section titles
 * are code names; sample copy comes from the design files, reading samples from seed/.
 */
export function ShowcasePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Vitrin</h1>
      <ButtonDemo />
      <IconButtonDemo />
      <ChipDemo />
      <CardDemo />
      <PageCardDemo />
      <SpeechBubbleDemo />
      <CompanionDemo />
      <MonsterDemo />
      <TileDemo />
      <BookCoverDemo />
      <StepTilesDemo />
      <MicButtonDemo />
      <SegmentedControlDemo />
      <OptionCardDemo />
      <SwitchDemo />
      <CheckboxDemo />
      <TextFieldDemo />
      <TextAreaDemo />
      <IconDemo />
    </main>
  );
}
