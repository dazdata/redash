import React from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import Tooltip from "@/components/Tooltip";
import CopyOutlinedIcon from "@ant-design/icons/CopyOutlined";
import "./CodeBlock.less";

export default class CodeBlock extends React.Component {
  static propTypes = {
    copyable: PropTypes.bool,
    children: PropTypes.node,
  };

  static defaultProps = {
    copyable: false,
    children: null,
  };

  state = { copied: null };

  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.copyFeatureEnabled = props.copyable && document.queryCommandSupported("copy");
    this.resetCopyState = null;
  }

  componentWillUnmount() {
    if (this.resetCopyState) {
      clearTimeout(this.resetCopyState);
    }
  }

  copy = () => {
    // select text
    window.getSelection().selectAllChildren(this.ref.current);

    // copy
    try {
      const success = document.execCommand("copy");
      if (!success) {
        throw new Error();
      }
      this.setState({ copied: "复制成功！" });
    } catch (err) {
      this.setState({
        copied: "复制失败。",
      });
    }

    // reset selection
    window.getSelection().removeAllRanges();

    // reset tooltip
    this.resetCopyState = setTimeout(() => this.setState({ copied: null }), 2000);
  };

  render() {
    const { copyable, children, ...props } = this.props;

    const copyButton = (
      <Tooltip title={this.state.copied || "复制"}>
        <Button icon={<CopyOutlinedIcon />} type="dashed" size="small" onClick={this.copy} />
      </Tooltip>
    );

    return (
      <div className="code-block">
        <code {...props} ref={this.ref}>
          {children}
        </code>
        {this.copyFeatureEnabled && copyButton}
      </div>
    );
  }
}
