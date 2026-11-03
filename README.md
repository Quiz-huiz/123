# Studiu

O aplicație statică de recapitulare, făcută să poată fi publicată direct cu Cloudflare Pages.

## Publicare

În Cloudflare Pages, conectați repository-ul și alegeți `main` ca branch. Nu este nevoie de comandă de build; directorul de ieșire este rădăcina repository-ului.

## Adăugarea unui quiz

Adăugați un fișier JSON în `assets/quiz/` și o intrare în lista `QUIZZES` din `app.js`. Formatul fiecărei întrebări:

```json
{
  "id": 1,
  "prompt": "Enunțul întrebării",
  "options": [
    { "id": "A", "text": "Varianta de răspuns", "correct": true },
    { "id": "B", "text": "Altă variantă", "correct": false }
  ],
  "images": []
}
```

`correct` poate fi `true` pentru una sau mai multe variante. Dacă există mai multe variante corecte, interfața prezintă automat întrebarea ca întrebare cu răspuns multiplu. Opțional, adăugați `category` pentru filtrare viitoare.

## Salvarea și transferul progresului

Răspunsurile și poziția curentă se păstrează local în browser. Codul din fereastra „Transferă progresul” exportă progresul selectat într-un text care poate fi copiat și încărcat pe alt dispozitiv. Nu este nevoie de cont sau server.
