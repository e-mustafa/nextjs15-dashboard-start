'use client';
import { useEffect, useState } from 'react';

import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { $getRoot } from 'lexical';

import { ListItemNode, ListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ParagraphNode, TextNode } from 'lexical';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ContentEditable } from './editor-ui/content-editable';
import { editorTheme } from './themes/editor-theme';

import { useTranslation } from 'react-i18next';
import { BlockFormatDropDown } from './plugins/toolbar/block-format-toolbar-plugin';
import { FormatBulletedList } from './plugins/toolbar/block-format/format-bulleted-list';
import { FormatCheckList } from './plugins/toolbar/block-format/format-check-list';
import { FormatHeading } from './plugins/toolbar/block-format/format-heading';
import { FormatNumberedList } from './plugins/toolbar/block-format/format-numbered-list';
import { FormatParagraph } from './plugins/toolbar/block-format/format-paragraph';
import { FormatQuote } from './plugins/toolbar/block-format/format-quote';
import { ClearFormattingToolbarPlugin } from './plugins/toolbar/clear-formatting-toolbar-plugin';
import { ElementFormatToolbarPlugin } from './plugins/toolbar/element-format-toolbar-plugin';
import { FontBackgroundToolbarPlugin } from './plugins/toolbar/font-background-toolbar-plugin';
import { FontColorToolbarPlugin } from './plugins/toolbar/font-color-toolbar-plugin';
import { FontFamilyToolbarPlugin } from './plugins/toolbar/font-family-toolbar-plugin';
import { FontFormatToolbarPlugin } from './plugins/toolbar/font-format-toolbar-plugin';
import { FontSizeToolbarPlugin } from './plugins/toolbar/font-size-toolbar-plugin';
import { ToolbarPlugin } from './plugins/toolbar/toolbar-plugin';

export type RichTextInputProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
};

const editorConfig: InitialConfigType = {
	namespace: 'ReusableEditor',
	theme: editorTheme,
	onError: (error: Error) => {
		console.error(error);
	},
	nodes: [HeadingNode, QuoteNode, ParagraphNode, TextNode, ListNode, ListItemNode],
};

export function RichTextInput({ value, onChange, placeholder = 'Start typing...' }: RichTextInputProps) {
	return (
		<div className='input w-full overflow-hidden rounded-lg border bg-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'>
			<LexicalComposer initialConfig={editorConfig}>
				<TooltipProvider>
					<EditorContent value={value} onChange={onChange} placeholder={placeholder} />
				</TooltipProvider>
			</LexicalComposer>
		</div>
	);
}

function EditorContent({ value, onChange, placeholder = 'Start typing...' }: RichTextInputProps) {
	const [editor] = useLexicalComposerContext();
	const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);

	const onRef = (_floatingAnchorElem: HTMLDivElement) => {
		if (_floatingAnchorElem !== null) {
			setFloatingAnchorElem(_floatingAnchorElem);
		}
	};

	// Inject initial value on first mount
	useEffect(() => {
		editor.update(() => {
			const root = $getRoot();
			root.clear();
			root.append($createParagraphNode().append($createTextNode(value)));
		});
	}, []);

	const handleChange = (editorState: any) => {
		editorState.read(() => {
			const root = $getRoot();
			onChange(root.getTextContent()); // Or convert to HTML if needed
		});
	};

	return (
		<div className='relative bg-transparent text-foreground '>
			<ToolbarPlugin>
				{() => (
					<div className='bg-muted text-muted-foreground vertical-align-middle sticky top-0 z-10 flex flex-wrap gap-1 overflow-auto border-b p-1'>
						<BlockFormatDropDown>
							<FormatParagraph />
							<FormatHeading levels={['h1', 'h2', 'h3']} />
							<FormatNumberedList />
							<FormatBulletedList />
							<FormatCheckList />
							<FormatQuote />
						</BlockFormatDropDown>
						<FontFamilyToolbarPlugin />
						<FontSizeToolbarPlugin />
						<FontFormatToolbarPlugin format='bold' />
						<FontFormatToolbarPlugin format='italic' />
						<FontFormatToolbarPlugin format='underline' />
						<FontFormatToolbarPlugin format='strikethrough' />
						<FontColorToolbarPlugin />
						<FontBackgroundToolbarPlugin />
						<ElementFormatToolbarPlugin />
						<ClearFormattingToolbarPlugin />
					</div>
				)}
			</ToolbarPlugin>

			<div className='relative'>
				<RichTextPlugin
					contentEditable={
						<div ref={onRef} className='bg-input/10'>
							<ContentEditable
								placeholder={placeholder}
								className='ContentEditable__root relative block min-h-72 overflow-auto p-4 bg-transparent focus:outline-none h-72'
							/>
						</div>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<OnChangePlugin onChange={handleChange} />
				<ListPlugin />
				<CheckListPlugin />
			</div>
		</div>
	);
}

function $createParagraphNode() {
	return new ParagraphNode();
}

function $createTextNode(text: string) {
	return new TextNode(text);
}
