IC240 Mechanics of Rigid Bodies

Readme Tutorial

June 11 2018

Truss Solver
   
Abhishek Tiwari                        Sandesh Joshi    
Archit Kumar                            Avnish Kumar
Aakash Kath                            Pramod Jonwal    
Gaingamsin Pamei                        Jonty Purbia

















How to use the truss solver:    2
Adding nodes:    3
Deleting nodes:    3
Adding members:    3
Deleting members:    4
Adding supports:    4
Deleting supports:    5
Adding loads:    5
Deleting loads:    6
To clear the screen:    6
Equations:    6
About us:    6






How to use the truss solver:

Extract the “truss solver.zip” code in your directory, a “truss solver” folder must have now appeared in your directory, enter the folder, various files appear on the screen, open the “index.html” in your web browser (preferably google chrome 44+ or firefox 44+), this is the user interface of the software.

On the right hand side of the html page you can see various buttons each of these buttons are used to provide different functionalities of building and solving the truss system.

Adding nodes:
1.Left-click the “Add Node” button

2.You can now add a node in your truss system just by performing a left-click at any point in the grid, let us see an example by adding 3 nodes.


Deleting nodes:
1.To delete a node take your mouse-pointer to the desired node and perform a right-click.

Adding members:
1.Left-click the “Add Member” button

2.You can now add a member in your truss system just by performing a left-click on a node and dragging your mouse pointer to another node in the grid, release the left click once you’ve reached the other node of the member, let us see an example by adding 3 members.


Deleting members:
1.To delete a member take your mouse-pointer to the desired member and perform a right-click.
Adding supports:
1.Left-click the “Add Fixed Support” button

2.You can now add a fixed support in your truss system by performing a left-click on a node.There are three types of support each of which can be toggled through by left-clicks, let us see an example of all three.



Deleting supports:
1.The first three left-click toggle between several kinds of fixed support, the fourth left-click results in deletion of the support.

Adding loads:
1.Left-click the “Add Load” button

2.Click on the node you want to exert the force on, and drag the mouse-pointer in your desired direction and release the left-click. The direction of this force is calculated relative to the horizontal axis and the magnitude is calculated per pixel of the grid. Farther the mouse pointer from the node higher is the magnitude of the load.

Deleting loads:
1.Right-click the desired load to delete it.

To clear the screen:
1.Left-click the “Clear” button.

2.A popup appears on the screen, click on “Ok” to clear your work and start afresh, click on “Cancel” to go back and continue the existing work.

Equations:
In a system where number of supports and members are balanced the results are displayed on individual members, otherwise an error message is displayed.

About us:
Click on the “About us” link at the bottom of the page to know about the algorithm used for solving the truss.
