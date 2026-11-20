import { DemoProfileSection, type DemoProfileSectionProps } from '../demo/DemoProfileSection';
import { ButtonDemo, IconButtonDemo } from './ButtonDemo';
import { LineChartDemo, ProgressBarDemo, StatCardDemo } from './DataDemo';
import {
  CheckboxDemo,
  OptionCardDemo,
  SegmentedControlDemo,
  SwitchDemo,
  TextAreaDemo,
  TextFieldDemo,
  ChoicePillsDemo,
  DialogDemo,
} from './FormDemo';
import { IconDemo } from './IconDemo';
import { BookCoverDemo, CompanionDemo, MonsterDemo, TileDemo } from './IllustrationDemo';
import { PhraseTextDemo, RaceBarDemo, ReadingTextDemo } from './ReadingDemo';
import { MicButtonDemo, StepTilesDemo } from './SessionDemo';
import styles from './Showcase.module.css';
import { CardDemo, ChipDemo, PageCardDemo, SpeechBubbleDemo } from './SurfaceDemo';

/**
 * /gelistirme/vitrin: every component of docs/tasarim-sistemi.md in every state. Section titles
 * are code names; sample copy comes from the design files, reading samples from seed/. The demo
 * profile section on top sets up the designs' sample child (phase 2a).
 */
export function ShowcasePage({ repository, today }: DemoProfileSectionProps) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Vitrin</h1>
      <DemoProfileSection repository={repository} today={today} />
      <ReadingTextDemo />
      <PhraseTextDemo />
      <RaceBarDemo />
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
      <ChoicePillsDemo />
      <DialogDemo />
      <TextAreaDemo />
      <StatCardDemo />
      <LineChartDemo />
      <ProgressBarDemo />
      <IconDemo />
    </main>
  );
}
