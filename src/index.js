import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Editor } from 'react-draft-wysiwyg';
import { convertToRaw, CompositeDecorator, ContentState, EditorState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from './library';
import '../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import './styles.css';

// in constructor, I use your code above, but I change outputEditorState to inputEditorState
// in the first Editor, I use this.state.inputEditorState as editorState

const orbitBlockDecoder = (nodeName, node) => {
  if (nodeName === 'img' && node instanceof HTMLImageElement) {
    const entityConfig = {};
    entityConfig.src = node.getAttribute ? node.getAttribute('src') || node.src : node.src;
    entityConfig.alt = node.alt;
    entityConfig.height = node.style.height;
    entityConfig.width = node.style.width;
    if (node.style.float) {
      entityConfig.alignment = node.style.float;
    }
    if (node.dataset.news_imageFileId) {
      entityConfig.orbitNewsFileId = parseInt(node.dataset.news_imageFileId, 10);
      entityConfig.orbitClassName = node.className;
    }
    return {
      type: 'IMAGE',
      mutability: 'MUTABLE',
      data: entityConfig,
    };
  }
};
const orbitInlineDecoder = (nodeName, node) => {
  if (nodeName === 'a' && node instanceof HTMLAnchorElement && node.dataset.linktype && node.dataset.linkid) {
    const entityConfig = {};
    entityConfig.url = node.getAttribute ? node.getAttribute('href') || node.href : node.href;
    entityConfig.title = node.innerHTML;
    entityConfig.targetOption = node.target;
    entityConfig.orbitLinkType = node.dataset.linktype;
    entityConfig.orbitLinkId = parseInt(node.dataset.linkid, 10);
    return {
      type: 'LINK',
      mutability: 'MUTABLE',
      data: entityConfig,
    };
  }
};
const orbitLinkDecorator = {
  strategy: (contentBlock, callback, contentState) => {
    contentBlock.findEntityRanges(character => {
      const entityKey = character.getEntity();
      if (entityKey == null) {
        return false;
      }
      const entity = contentState.getEntity(entityKey);
      const data = entity.getData();
      return data.orbitLinkType != null && data.orbitLinkId != null && entity.getType() === 'LINK';
    }, callback);
  },
  component: props => {
    const entity = props.contentState.getEntity(props.entityKey);
    const data = entity.getData();
    return (
      <a title={data.title} href={data.url} data-linktype={data.orbitLinkType} data-linkid={data.orbitLinkId}>
        ("{props.decoratedText}")
      </a>
    );
  },
};
const orbitCompositeDecorator = new CompositeDecorator([orbitLinkDecorator]);

const convertToHTML = editorContent =>
  draftToHtml(editorContent, null, null, (entity, text) => {
    if (entity.type === 'LINK' && entity.data.orbitLinkType != null && entity.data.orbitLinkId != null) {
      const targetOption = entity.data.targetOption || '_self';
      const orbitLinkType = entity.data.orbitLinkType;
      const orbitLinkId = entity.data.orbitLinkId;
      return `<a href="${
        entity.data.url
      }" target="${targetOption}" data-linktype="${orbitLinkType}" data-linkid="${orbitLinkId}">${text}</a>`;
    }
    if (entity.type === 'IMAGE' && entity.data.orbitNewsFileId != null) {
      const { orbitNewsFileId, orbitClassName, src, alt, alignment, height, width } = entity.data;

      const style = [
        alignment ? `float:${alignment}` : null,
        height ? `height:${height}` : null,
        width ? `width:${width}` : null,
      ]
        .filter(s => s != null)
        .join(';');

      return `<img src="${src}" alt="${alt}" style="${style}" class="${orbitClassName}" data-news_image-file-id="${orbitNewsFileId}" />`;
    }
    return null;
  });

class Playground extends Component {
  // state = {
  //   outputEditorState: undefined,
  // }

  constructor(props) {
    super(props);
    // const html = `Hello <a href="/wiki/articles/45" data-linktype="wiki" data-linkid="45">link</a> and image<div><img src="https://orbit.secoya.dk/rest/fileexplorer/filesystem/files/710/download" class="full-width" style="height: 649px;" data-news_image-file-id="710"><br></div>`;
    const html = `Hi <a href="/wiki/articles/45" data-linktype="wiki" data-linkid="45">link</a> and <a href="www.google.com">other</a>.`;
    const contentBlock = htmlToDraft(html, orbitBlockDecoder, orbitInlineDecoder);
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks, contentBlock.entityMap);
      const inputEditorState = EditorState.createWithContent(contentState, orbitCompositeDecorator);
      this.state = {
        inputEditorState,
      };
    }
  }

  onInputEditorChange = inputEditorState => {
    console.log('into onInputEditorChange');
    // console.log('*****', inputEditorState.getCurrentContent())
    const rawContent = convertToRaw(inputEditorState.getCurrentContent());
    const html = convertToHTML(rawContent);
    console.log('html', html);
    const contentBlock = htmlToDraft(html, orbitBlockDecoder, orbitInlineDecoder);
    //    console.log('1', contentBlock)
    // console.log('2', convertFromHTML(html) && convertFromHTML(html))
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
      const outputEditorState = EditorState.createWithContent(contentState, orbitCompositeDecorator);
      this.setState({
        inputEditorState,
        outputEditorState,
      });
      // console.log('1', inputEditorState.getCurrentContent().getBlocksAsArray())
      // console.log('2', contentBlock.contentBlocks)
    }
  };

  render() {
    // console.log('*****', this.state.inputEditorState.getCurrentContent().toJS());
    // value={this.state.inputEditorState && convertToHTML(convertToRaw(this.state.inputEditorState.getCurrentContent()))}
    return (
      <div>
        <div style={{ height: 200 }}>
          <Editor
            customDecorators={[orbitLinkDecorator]}
            editorState={this.state.inputEditorState}
            onEditorStateChange={this.onInputEditorChange}
          />
        </div>
        <div style={{ height: 200 }}>
          <textarea
            disabled
            className="demo-content"
            value={
              this.state.inputEditorState &&
              convertToHTML(convertToRaw(this.state.inputEditorState.getCurrentContent()))
            }
          />
        </div>
        <div style={{ height: 200 }}>
          <Editor customDecorators={[orbitLinkDecorator]} editorState={this.state.outputEditorState} />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Playground />, document.getElementById('root'));
