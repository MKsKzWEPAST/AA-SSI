import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { switchMode, clear as clearStates} from "../redux/action";
import { OverlayTrigger, Button, ButtonGroup, ToggleButton, Popover } from "react-bootstrap";

function BackOffice() {
    const dispatch = useDispatch();
    const state = useSelector((state) => state.handleMode);
    const [popoverOpen, setPopoverOpen] = useState(false);

    function clear() {
        dispatch(clearStates())
    }

    const radios = [
        { name: 'Fast', value: 'fast' },
        { name: 'Secure', value: 'secure' },
    ];

    function changeRadio() {
        dispatch(switchMode())
    }

    const popover = (
        <Popover id="popover-basic">
            <Popover.Header as="h2">Change Store Mode</Popover.Header>
            <Popover.Body>
                <div className="d-flex flex-column align-items-center">
                    <div className="overflow-hidden">
                        <ButtonGroup className="mb-0">
                            {radios.map((radio, idx) => (
                                <ToggleButton
                                    key={idx}
                                    className={idx === 0 ? "rounded-start" : (idx === radios.length - 1 ? "rounded-end" : "")}
                                    id={`radio-${idx}`}
                                    type="radio"
                                    variant="secondary"
                                    name="radio"
                                    value={state}
                                    checked={radio.value === state}
                                    onChange={(e) => changeRadio()}>
                                    {radio.name}
                                </ToggleButton>
                            ))}
                        </ButtonGroup>
                    </div>

                    <div className="mt-2">
                        <button className="btn btn-outline-secondary" type="button" onClick={clear}>
                            clear
                        </button>
                    </div>
                </div>
            </Popover.Body>
        </Popover>
    );

    const handleToggle = () => {
        setPopoverOpen(!popoverOpen);
    };

    return (
        <OverlayTrigger trigger="click" placement="bottom" show={popoverOpen} overlay={popover} onToggle={handleToggle}>
            <Button variant="outline-secondary" style={{ position: 'fixed', bottom: '80%', left: '5%', zIndex: 10}}>...</Button>
        </OverlayTrigger>
    );
}

export default BackOffice;