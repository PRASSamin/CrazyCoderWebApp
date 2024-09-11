import React, { useState, useRef, useEffect } from 'react';

function SelectionPanel({ type, platforms, cornerButton, activePlatform, slectPlatform, cornerBtnClickFun }) {
    const handleCornerButtonClick = (e) => {
        if (type === 'contest') {
            cornerBtnClickFun(e.target.innerText);
        } else {
            cornerBtnClickFun();
        }
    };

    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [clickedOnce, setClickedOnce] = useState(false);


    useEffect(() => {
        const container = containerRef.current;

        const handleMouseDown = (e) => {
            if (!clickedOnce) {
                setIsDragging(true);
                setStartX(e.pageX - container.offsetLeft);
                setScrollLeft(container.scrollLeft);
                setClickedOnce(true);
            }
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseup', handleMouseUp);

        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, startX, scrollLeft, clickedOnce]);

    const handleContainerClick = () => {
        setClickedOnce(false);
    };

    const platformChange = (platform) => {
        slectPlatform(platform?.slug);
    };

    return (
        <div className='flex pl-6 pr-2 mt-2 lg:px-10 lg:mt-2 pb-2 bg-bgcolor '>
            <div className='bg-blue min-w-24 text-center flex items-center justify-center'>
                <button
                    className='text-white px-2 py-1 lg:px-2 lg:py-1 cursor-pointer'
                    onClick={(e) => {
                        handleCornerButtonClick(e);
                    }}
                >
                    {cornerButton}
                </button>
            </div>
            <div className='w-0 ml-2 border-l-2 border-light-grey'></div>
            <ul
                ref={containerRef}
                className='flex item-center justify-start overflow-auto scrollbar-hide px-1'
                onClick={handleContainerClick}
            >
                {platforms.map((platform, index) => (
                    <li
                        key={index}
                        onClick={() => {
                            platformChange(platform);
                        }}
                        className={`${activePlatform === platform.slug
                            ? 'bg-blue border-blue'
                            : 'bg-transparent border-white rounded-3xl'
                            } border-2 text-white rounded-3xl mx-2 px-3 py-1 cursor-pointer flex items-center justify-center select-none`}
                    >
                        {platform.name}
                    </li>
                ))}
            </ul>
            <button
                className='md:hidden'
                onClick={() => {
                    containerRef.current.scrollLeft += 100;
                }}
            >
                <img className='w-24 max-h-12' src='/Right.gif' />
            </button>
        </div>
    );
}

export default SelectionPanel;
