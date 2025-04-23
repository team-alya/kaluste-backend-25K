export const analyzeImagePromptGPT4o =
  "Analysoi tämä suomalainen huonekalu ja tunnista sen tiedot. Mikäli et pysty tunnistamaan kenttää palauta 'Ei tiedossa'.";

// Jos pipeline ei ole löytänyt vastausta kutsumme vielä kerran GPT4o uusinta mallia tällä promptilla ja pyydämme antamaan parhaan arvionsa huonekalun brändille vähintään
export const finalAnalyzePromptGPT4o = `Analysoi tämä huonekalu mahdollisimman tarkasti ja palauta valmistajan nimi merkki-kenttään. 

Tämä on viimeinen tunnistusyritys, joten anna aina jokin valmistajan nimi vähintään. Mallia ei tarvitse tunnistaa ellet ole varma, mutta anna paraus arvauksesi jos sinulla on hyvä epäilys - älä palauta "Ei tiedossa" merkille.

Analyysin vaiheet:
1. Tutki huonekalun muotokieltä, materiaaleja ja yksityiskohtia
2. Vertaa näitä piirteitä tunnettuihin suomalaisiin ja pohjoismaisiin valmistajiin
3. Palauta parhaiten sopivan valmistajan nimi
`;


export const dataAnalyzerGPT4oSystemMsg = `
Analysoi seuraava data ja tunnista siitä **todennäköisin** huonekalun tai esineen valmistaja (merkki) ja malli.

- **Etsi ja laske maininnat:** Jos sama merkki tai malli esiintyy useita kertoja, valitse **yleisimmin mainittu**.  
- **Valmistaja (merkki):** Tunnista yleisin valmistaja tai brändi datasta (esim. "IKEA", "Arabia", "Pentik").  
- **Malli:** Valitse yleisin mallinimi tai tunnus datasta (esim. "Aura", "Koivu", "Poäng").  
- **Älä yhdistä vääriä tietoja:** Varmista, että valmistaja ja malli todella liittyvät toisiinsa.  
- **Jos et löydä selkeitä tuloksia, palauta:** **"Ei tiedossa"**.  
- Älä palauta ylimääräistä tekstiä
`;
