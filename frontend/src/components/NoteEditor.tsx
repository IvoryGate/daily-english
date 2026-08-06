import { useEffect, useRef } from 'react'
import {
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ConditionalContents,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  codeBlockPlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  toolbarPlugin,
  type MDXEditorMethods,
} from '@mdxeditor/editor'

interface NoteEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** 笔记所见即所得编辑器：mdx-editor（Lexical），主题对齐 shadcn CSS 变量 */
export function NoteEditor({ value, onChange, placeholder }: NoteEditorProps) {
  const ref = useRef<MDXEditorMethods>(null)

  useEffect(() => {
    const methods = ref.current
    if (methods && value !== methods.getMarkdown()) {
      methods.setMarkdown(value)
    }
  }, [value])

  return (
    <MDXEditor
      ref={ref}
      markdown={value}
      onChange={onChange}
      contentEditableClassName="min-h-64 max-w-none"
      className="mdxeditor rounded-xl"
      placeholder={placeholder ?? '开始输入…（选中文本可直接加粗 / 插入链接）'}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        markdownShortcutPlugin(),
        codeBlockPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <ListsToggle />
              <CreateLink />
              <ConditionalContents
                options={[
                  {
                    when: (editor) => editor?.editorType === 'codeblock',
                    contents: () => null,
                  },
                  {
                    fallback: () => <InsertCodeBlock />,
                  },
                ]}
              />
            </DiffSourceToggleWrapper>
          ),
        }),
      ]}
    />
  )
}
