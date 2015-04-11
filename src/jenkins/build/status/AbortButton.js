import React from "react/addons";
import _ from "lodash";
import {Modal, Button, ModalTrigger} from "react-bootstrap";
import BuildActions from "../BuildActions";
import Mixins from "../../../util/Mixins";

class AbortModal extends React.Component {
    abort() {
        BuildActions.abort(this.props.build);
        _.forEach(this.props.subsets || [], (subset) => {
            BuildActions.abort(subset);
        });
        this.props.onRequestHide();
    }

    render() {
        return (
            <Modal {...this.props} title="Abort?" bsStyle="danger" animation={false}>
                <div className="modal-body">
                    This will stop the build and any related subsets.
                </div>
                <div className="modal-footer">
                    <Button bsStyle="danger" onClick={this.abort.bind(this)}>Abort</Button>
                </div>
            </Modal>
        );
    }
}

Mixins.add(AbortModal.prototype, [React.addons.PureRenderMixin]);

export default class AbortButton extends React.Component {
    render() {
        return (
            <ModalTrigger modal={<AbortModal {...this.props} />}>
                <Button style={{float: "right"}} title="Abort build and subsets">
                    Abort
                </Button>
            </ModalTrigger>
        );
    }
}

Mixins.add(AbortButton.prototype, [React.addons.PureRenderMixin]);