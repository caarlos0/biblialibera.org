import { Badge } from '../design-system/components/core'
import { Footnote, FootnoteList, RegisterToggle, ReviewSeal, VerseBlock } from '../design-system/components/reading'
import type { ReaderBook, View } from './readerData'
import { renderVerseText } from './scriptureText'
import { verseInteractionProps } from './verseInteraction'
import type { VerseClick, VerseRange } from './verseSelection'
import { footnoteElementId, footnoteRefElementId, isVerseSelected } from './verseSelection'

export interface ChapterViewProps {
  book: ReaderBook
  chapter: number
  view: View
  onViewChange: (view: View) => void
  /** The verses currently selected, highlighted and reflected in the URL. */
  selection: VerseRange | null
  onSelectVerse: (verse: number, click: VerseClick) => void
}

/**
 * ChapterView: one chapter of a loaded book in the selected view. The pt
 * text renders with the note apparatus and the review seal; the original
 * view renders the source text plain (no divine-name or footnote treatment,
 * which are pt-specific), in its own reading direction and font, with the
 * edition citation in place of the seal.
 */
export function ChapterView({ book, chapter, view, onViewChange, selection, onSelectVerse }: ChapterViewProps) {
  const current = book.chapters.find((c) => c.chapter === chapter)
  const original = book.original

  const options = [
    { value: 'formal', label: 'Português' },
    ...(original ? [{ value: 'original', label: `Original (${original.language})` }] : []),
  ]

  return (
    <div className="mx-auto max-w-[var(--reading-measure)]">
      <div className="mb-[var(--space-6)] flex flex-wrap items-center justify-between gap-[var(--space-4)] border-b border-[var(--color-border)] pb-[var(--space-5)]">
        <h1 className="m-0 font-serif text-[var(--text-2xl)] text-[var(--color-text)]">
          {book.name} {chapter}
        </h1>
        <div className="flex flex-wrap items-center gap-[var(--space-4)]">
          <RegisterToggle value={view} onChange={(value) => onViewChange(value as View)} options={options} />
          {view === 'original' ? (
            original && <Badge>{original.edition}</Badge>
          ) : (
            <ReviewSeal status={book.status[view]} size="sm" />
          )}
        </div>
      </div>

      {view === 'original' ? (
        <OriginalChapter
          verses={current?.original ?? []}
          dir={original?.dir ?? 'ltr'}
          selection={selection}
          onSelectVerse={onSelectVerse}
        />
      ) : (
        <RegisterChapter
          verses={current?.[view] ?? []}
          idPrefix={view}
          selection={selection}
          onSelectVerse={onSelectVerse}
        />
      )}
    </div>
  )
}

interface RegisterChapterProps {
  verses: { verse: number; text: string; footnotes: string[] }[]
  idPrefix: string
  selection: VerseRange | null
  onSelectVerse: (verse: number, click: VerseClick) => void
}

function RegisterChapter({ verses, idPrefix, selection, onSelectVerse }: RegisterChapterProps) {
  let noteNumber = 1
  const rendered = verses.map((verse) => {
    const result = renderVerseText(verse.text, verse.footnotes, idPrefix, noteNumber)
    noteNumber += result.notes.length
    return { verse: verse.verse, ...result }
  })
  const notes = rendered.flatMap((v) => v.notes.map((note) => ({ ...note, verse: v.verse })))

  return (
    <div key={idPrefix}>
      {rendered.map(({ verse, body }) => (
        <VerseBlock
          key={verse}
          number={verse}
          {...verseInteractionProps({
            verse,
            selected: isVerseSelected(selection, verse),
            onSelect: onSelectVerse,
          })}
        >
          {body}
        </VerseBlock>
      ))}
      {notes.length > 0 && (
        <FootnoteList>
          {notes.map((note) => (
            <Footnote key={note.number} n={note.number} id={footnoteElementId(idPrefix, note.number)}>
              {note.text}{' '}
              <a
                href={`#${footnoteRefElementId(idPrefix, note.number)}`}
                aria-label={`Voltar ao versículo ${note.verse}`}
                className="whitespace-nowrap font-sans text-[var(--color-footnote-marker)] no-underline hover:underline"
              >
                ↩
              </a>
            </Footnote>
          ))}
        </FootnoteList>
      )}
    </div>
  )
}

interface OriginalChapterProps {
  verses: { verse: number; text: string }[]
  dir: 'rtl' | 'ltr'
  selection: VerseRange | null
  onSelectVerse: (verse: number, click: VerseClick) => void
}

function OriginalChapter({ verses, dir, selection, onSelectVerse }: OriginalChapterProps) {
  if (verses.length === 0) {
    return (
      <p className="font-sans text-[var(--text-sm)] text-[var(--color-text-muted)]">
        Texto original não disponível para este capítulo.
      </p>
    )
  }

  return (
    <div dir={dir} className="font-[family-name:var(--font-original)]">
      {verses.map((v) => {
        const props = verseInteractionProps({
          verse: v.verse,
          selected: isVerseSelected(selection, v.verse),
          onSelect: onSelectVerse,
        })
        return (
          <p
            key={v.verse}
            {...props}
            className={`m-0 mb-[var(--space-4)] text-[var(--text-xl)] leading-[var(--leading-relaxed)] text-[var(--color-text-verse)] ${props.className}`}
          >
            <sup className="me-[0.35em] align-super font-mono text-[var(--text-xs)] text-[var(--color-verse-number)]">
              {v.verse}
            </sup>
            {v.text}
          </p>
        )
      })}
    </div>
  )
}
