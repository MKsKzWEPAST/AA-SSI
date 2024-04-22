import React from "react";
import { Spinner } from "@utils";

const handleEventHeader = () =>
    fetch("http://localhost:5050/tnco/backend-apis/v1/auth", {
        method: "POST",
        credentials: "include",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "access-control-allow-origin": "*",
        },
        body: JSON.stringify({
            operator: "ONP_INTERNET",
            secret: "P@ssw0rd",
        }),
    })
        .then((response) => response.json())
        .then((data) =>
            fetch(
                "http://localhost:5050/tnseb/backend-apis/catalogService/v1_33/getCatalogDetailed",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${data.token}`,
                    },
                    body: JSON.stringify({
                        productCode: "Barbe",
                    }),
                }
            )
        )
        .then((response) => response.json())
        .catch((error) => console.error(error));


class EventContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            catalog: null,
            performances: null,
            product: null,
            topics: null,
            availabilities: null,
            flowConfig: null,
        };
    }
    async componentDidMount() {
        const sessionConfig = JSON.parse(sessionStorage.getItem("flowConfig"));
        this.setState({ flowConfig: sessionConfig?.["EVENT_DETAILS"] });
        const catalog = await handleEventHeader();
        const pointOfSales = await getPOSConfig();

        const performances =
            catalog != null
                ? catalog.catalogData.seasons[0].products[0].event.performances.sort(
                    (a, b) => new Date(a.start) - new Date(b.start)
                )
                : null;
        const product =
            catalog != null ? catalog.catalogData.seasons[0].products[0] : null;
        const topics = catalog != null ? catalog.catalogData.seasons[0].topics : [];

        const pointOfSalesId = pointOfSales.posConfigData.posId;

        const token = await getAuthToken();

        const availabilitiesPromise = performances.map((performance) => {
            const seatCategoryIds = performance.seatCategories.map(
                (seatCategory) => seatCategory.id
            );

            return getEventAvailability(
                product.id,
                pointOfSalesId,
                [performance.id],
                seatCategoryIds,
                token
            );
        });

        const availabilities = await Promise.all(availabilitiesPromise);

        const finalAvailabilities = availabilities.flatMap(
            (availability) => availability.eventAvailabilityData.eventAvailabilities
        );

        this.setState({
            catalog: catalog,
            performances: performances,
            product: product,
            topics: topics,
            availabilities: finalAvailabilities,
        });
    }

    componentDidUpdate() {
        const contactNumber = sessionStorage.getItem("contactNumber");
        if (
            contactNumber == null &&
            this.state.flowConfig != null &&
            this.state.flowConfig.mustBeLoggedIn.value
        ) {
            this.props.onNavigateToLogin();
        }
    }

    onClickReserve = () => {
        const elemento = document.getElementById("event-performances");
        elemento.scrollIntoView({ behavior: "smooth" });
    };
    render() {
        const { onClickBook, onNavigateToLogin } = this.props;

        return this.state.catalog != null ? (
            <div className="event-content">
                <EventHeader
                    product={this.state.product}
                    performances={this.state.performances}
                    topics={this.state.topics}
                    onClickReserve={() => this.onClickReserve()}
                />
                <EventPerformances
                    id="event-performances"
                    performances={this.state.performances}
                    availabilities={this.state.availabilities}
                    productId={this.state.product.id}
                    onClickBook={onClickBook}
                    onNavigateToLogin={onNavigateToLogin}
                />
            </div>
        ) : (
            <Spinner />
        );
    }
}
export default EventContainer;
