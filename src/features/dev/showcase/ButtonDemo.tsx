import { Button } from '../../../components/Button/Button';
import { IconButton } from '../../../components/IconButton/IconButton';
import { Row, Section } from './Section';

// Sample labels come from the design files named next to each row.
export function ButtonDemo() {
  return (
    <Section name="Button">
      <Row label="variant (regular): primary V2 · saffron U1 · secondary G2 · dark · danger">
        <Button icon="plus">Isınmaya ekle</Button>
        <Button variant="saffron" icon="plus">
          Yeni kitap
        </Button>
        <Button variant="secondary" icon="volume">
          Kelimeyi dinle
        </Button>
        <Button variant="dark">dark</Button>
        <Button variant="danger">danger</Button>
      </Row>
      <Row label="size=large: G1 · G7">
        <Button size="large" icon="play">
          Başla
        </Button>
        <Button size="large" variant="secondary">
          Kapat
        </Button>
      </Row>
      <Row label="icon: G4 web · V1">
        <Button variant="secondary" icon="pause">
          Duraklat
        </Button>
        <Button variant="secondary" icon="flag">
          Okumayı bitir
        </Button>
        <Button variant="secondary" icon="target">
          Hedefi güncelle
        </Button>
      </Row>
      <Row label="fullWidth size=large: K1 telefon">
        <Button size="large" icon="right" fullWidth>
          Hesabı oluştur
        </Button>
      </Row>
      <Row label="disabled (not drawn) · to (link)">
        <Button size="large" icon="right" disabled>
          Kitabımı yap
        </Button>
        <Button to="/gelistirme/vitrin" variant="saffron">
          to=&quot;/gelistirme/vitrin&quot;
        </Button>
      </Row>
    </Section>
  );
}

export function IconButtonDemo() {
  return (
    <Section name="IconButton">
      <Row label="size=44: G2 telefon · U3 telefon · V1 (iconSize 18)">
        <IconButton icon="x" label="Seanstan çık" />
        <IconButton icon="left" label="Geri dön" />
        <IconButton icon="left" label="Önceki hafta" iconSize={18} />
        <IconButton icon="right" label="Sonraki hafta" iconSize={18} />
      </Row>
      <Row label="size=46 tone=saffron: G3 · size=48: G2 tablet, U3 tablet">
        <IconButton icon="pause" label="Seslendirmeyi duraklat" size={46} tone="saffron" />
        <IconButton icon="x" label="Seanstan çık" size={48} />
        <IconButton icon="left" label="Geri dön" size={48} iconSize={20} />
      </Row>
      <Row label="size=52 raised: G4 telefon, G2 · tone=saffron: G5">
        <IconButton icon="pause" label="Duraklat" size={52} raised />
        <IconButton icon="flag" label="Okumayı bitir" size={52} raised />
        <IconButton icon="volume" label="Kelimeyi dinle" size={52} raised />
        <IconButton icon="play" label="Kaydı dinle" size={52} tone="saffron" />
      </Row>
      <Row label="disabled (not drawn) · to (link)">
        <IconButton icon="pause" label="Duraklat" size={52} raised disabled />
        <IconButton icon="x" label="Seanstan çık" to="/gelistirme/vitrin" />
      </Row>
    </Section>
  );
}
